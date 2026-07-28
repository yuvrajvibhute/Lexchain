const fs = require('fs');
const path = require('path');
const os = require('os');

// Path resolution for persistent DB file
function getDbFilePath() {
    if (process.env.VERCEL) {
        return path.join(os.tmpdir(), 'lexchain_db.json');
    }
    const dir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dir)) {
        try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    }
    return path.join(dir, 'lexchain_db.json');
}

// In-Memory Database Store
const dbStore = {
    Evidence: [],
    User: [],
    Lawyer: [],
    Case: [],
    Hearing: [],
    CourtOrder: [],
    AccessRequest: [],
    LawyerRating: [],
    Feedback: [],
    WalletInteraction: []
};

let isLoaded = false;

// Load database from disk
async function loadDatabase() {
    if (isLoaded) return;
    const filePath = getDbFilePath();
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(raw);
            for (const key of Object.keys(dbStore)) {
                if (Array.isArray(data[key])) {
                    dbStore[key] = data[key];
                }
            }
            console.log(`📁 LexDB loaded from ${filePath}`);
        }
    } catch (err) {
        console.warn("LexDB read error, starting fresh:", err.message);
    }
    isLoaded = true;
}

// Save database to disk asynchronously
function saveDatabaseSync() {
    try {
        const filePath = getDbFilePath();
        fs.writeFileSync(filePath, JSON.stringify(dbStore, null, 2), 'utf8');
    } catch (err) {
        console.warn("LexDB write error:", err.message);
    }
}

// Filter matching helper
function matchFilter(doc, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;

    for (const key of Object.keys(filter)) {
        if (key === '$or') {
            const orList = filter['$or'];
            if (!Array.isArray(orList)) continue;
            const match = orList.some(subFilter => matchFilter(doc, subFilter));
            if (!match) return false;
            continue;
        }

        const val = filter[key];
        const docVal = doc[key];

        if (val && typeof val === 'object' && !Array.isArray(val)) {
            if ('$in' in val) {
                const list = val['$in'] || [];
                if (!list.includes(docVal)) return false;
            } else if ('$regex' in val) {
                const reg = new RegExp(val['$regex'], val['$options'] || 'i');
                if (!reg.test(String(docVal || ''))) return false;
            } else {
                if (JSON.stringify(docVal) !== JSON.stringify(val)) return false;
            }
        } else {
            if (docVal !== val) return false;
        }
    }
    return true;
}

// Apply updates ($set, $push, $inc, etc.)
function applyUpdate(doc, update) {
    if (!update) return doc;
    if (update.$set) {
        Object.assign(doc, update.$set);
    }
    if (update.$push) {
        for (const key of Object.keys(update.$push)) {
            if (!Array.isArray(doc[key])) doc[key] = [];
            doc[key].push(update.$push[key]);
        }
    }
    if (update.$inc) {
        for (const key of Object.keys(update.$inc)) {
            doc[key] = (Number(doc[key]) || 0) + Number(update.$inc[key]);
        }
    }
    for (const key of Object.keys(update)) {
        if (key !== '$set' && key !== '$push' && key !== '$inc' && key !== '$unset') {
            doc[key] = update[key];
        }
    }
    return doc;
}

// Generate unique ID helper
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// Attach .toJSON() helper to objects
function toDocObject(item) {
    if (!item) return null;
    const plain = JSON.parse(JSON.stringify(item));
    Object.defineProperty(plain, 'toJSON', {
        value: function () {
            const copy = { ...this };
            delete copy.toJSON;
            return copy;
        },
        enumerable: false,
        configurable: true,
        writable: true
    });
    return plain;
}

// Query builder wrapper for standard Mongoose-like syntax
class QueryBuilder {
    constructor(collectionName, filter = {}) {
        this.collectionName = collectionName;
        this.filter = filter;
        this._sort = null;
        this._select = null;
        this._limit = null;
        this._skip = 0;
        this._single = false;
    }

    sort(sortObj) {
        this._sort = sortObj;
        return this;
    }

    select(fields) {
        this._select = fields;
        return this;
    }

    limit(n) {
        this._limit = n;
        return this;
    }

    skip(n) {
        this._skip = n;
        return this;
    }

    lean() {
        return this;
    }

    _exec() {
        const arr = dbStore[this.collectionName] || [];
        let matches = arr.filter(doc => matchFilter(doc, this.filter));

        if (this._sort) {
            const sortKeys = Object.keys(this._sort);
            matches.sort((a, b) => {
                for (const k of sortKeys) {
                    const dir = this._sort[k];
                    const valA = a[k] instanceof Date ? a[k].getTime() : a[k];
                    const valB = b[k] instanceof Date ? b[k].getTime() : b[k];
                    if (valA < valB) return dir === -1 ? 1 : -1;
                    if (valA > valB) return dir === -1 ? -1 : 1;
                }
                return 0;
            });
        }

        if (this._skip > 0) {
            matches = matches.slice(this._skip);
        }

        if (this._limit && this._limit > 0) {
            matches = matches.slice(0, this._limit);
        }

        if (this._select) {
            const keys = typeof this._select === 'string' ? this._select.split(' ').filter(Boolean) : [];
            if (keys.length > 0) {
                matches = matches.map(doc => {
                    const newDoc = {};
                    for (const k of keys) {
                        if (k.startsWith('-')) continue;
                        if (k in doc) newDoc[k] = doc[k];
                    }
                    return newDoc;
                });
            }
        }

        if (this._single) {
            return matches.length > 0 ? toDocObject(matches[0]) : null;
        }

        return matches.map(item => toDocObject(item));
    }

    then(resolve, reject) {
        try {
            const res = this._exec();
            resolve(res);
        } catch (err) {
            reject(err);
        }
    }
}

// Collection Model Factory
function createModel(modelName) {
    class ModelInstance {
        constructor(data = {}) {
            Object.assign(this, data);
            if (!this._id) this._id = generateId();
            if (!this.id) this.id = this._id;
        }

        toJSON() {
            const copy = { ...this };
            delete copy.toJSON;
            return copy;
        }

        async save() {
            await loadDatabase();
            const arr = dbStore[modelName];
            const existingIdx = arr.findIndex(item => (item.id && item.id === this.id) || (item._id && item._id === this._id));
            const plain = JSON.parse(JSON.stringify(this));
            if (existingIdx >= 0) {
                arr[existingIdx] = plain;
            } else {
                arr.push(plain);
            }
            saveDatabaseSync();
            return toDocObject(this);
        }
    }

    ModelInstance.modelName = modelName;

    ModelInstance.find = function (filter = {}) {
        loadDatabase();
        return new QueryBuilder(modelName, filter);
    };

    ModelInstance.findOne = function (filter = {}) {
        loadDatabase();
        const q = new QueryBuilder(modelName, filter);
        q._single = true;
        return q;
    };

    ModelInstance.findById = function (id) {
        return ModelInstance.findOne({ id });
    };

    ModelInstance.countDocuments = async function (filter = {}) {
        await loadDatabase();
        const arr = dbStore[modelName] || [];
        return arr.filter(doc => matchFilter(doc, filter)).length;
    };

    ModelInstance.create = async function (docData) {
        await loadDatabase();
        const instance = new ModelInstance(docData);
        await instance.save();
        return toDocObject(instance);
    };

    ModelInstance.insertMany = async function (docsArray) {
        await loadDatabase();
        const created = [];
        for (const item of docsArray) {
            const inst = new ModelInstance(item);
            await inst.save();
            created.push(toDocObject(inst));
        }
        return created;
    };

    ModelInstance.findOneAndUpdate = async function (filter, update, options = {}) {
        await loadDatabase();
        const arr = dbStore[modelName] || [];
        let idx = arr.findIndex(doc => matchFilter(doc, filter));
        if (idx < 0) {
            if (options.upsert) {
                const newId = filter.id || generateId();
                const newDoc = { _id: newId, id: newId };
                // Apply the filter fields first, then the update
                for (const key of Object.keys(filter)) {
                    if (!key.startsWith('$')) newDoc[key] = filter[key];
                }
                applyUpdate(newDoc, update);
                arr.push(newDoc);
                saveDatabaseSync();
                return toDocObject(newDoc);
            }
            return null;
        }
        applyUpdate(arr[idx], update);
        saveDatabaseSync();
        return toDocObject(arr[idx]);
    };

    ModelInstance.findByIdAndUpdate = async function (id, update, options = {}) {
        // Search by both 'id' string field and '_id' field for compatibility
        await loadDatabase();
        const arr = dbStore[modelName] || [];
        const idx = arr.findIndex(doc => doc.id === id || doc._id === id);
        if (idx < 0) {
            if (options.upsert) {
                const newDoc = { _id: id, id };
                applyUpdate(newDoc, update);
                arr.push(newDoc);
                saveDatabaseSync();
                return toDocObject(newDoc);
            }
            return null;
        }
        applyUpdate(arr[idx], update);
        saveDatabaseSync();
        return toDocObject(arr[idx]);
    };

    ModelInstance.updateOne = async function (filter, update) {
        return ModelInstance.findOneAndUpdate(filter, update);
    };

    ModelInstance.aggregate = async function (pipeline) {
        await loadDatabase();
        let docs = dbStore[modelName] || [];
        for (const stage of pipeline) {
            if (stage.$match) {
                docs = docs.filter(doc => matchFilter(doc, stage.$match));
            } else if (stage.$group) {
                const group = stage.$group;
                let sum = 0;
                let count = 0;
                for (const d of docs) {
                    if (d.rating) {
                        sum += Number(d.rating);
                        count++;
                    }
                }
                const avg = count > 0 ? sum / count : 0;
                return [{ _id: null, avg, count }];
            }
        }
        return docs.map(d => toDocObject(d));
    };

    ModelInstance.distinct = async function (field, filter = {}) {
        await loadDatabase();
        const arr = dbStore[modelName] || [];
        const filtered = filter && Object.keys(filter).length > 0
            ? arr.filter(doc => matchFilter(doc, filter))
            : arr;
        const unique = [...new Set(filtered.map(doc => doc[field]).filter(v => v !== undefined && v !== null))];
        return unique;
    };

    return ModelInstance;
}

const Models = {
    Evidence: createModel('Evidence'),
    User: createModel('User'),
    Lawyer: createModel('Lawyer'),
    Case: createModel('Case'),
    Hearing: createModel('Hearing'),
    CourtOrder: createModel('CourtOrder'),
    AccessRequest: createModel('AccessRequest'),
    LawyerRating: createModel('LawyerRating'),
    Feedback: createModel('Feedback'),
    WalletInteraction: createModel('WalletInteraction'),
    loadDatabase,
    seedAppDatabase: async (MOCK_EVIDENCE) => {
        await loadDatabase();
        if (dbStore.Evidence.length === 0 && MOCK_EVIDENCE && Array.isArray(MOCK_EVIDENCE)) {
            console.log('Seeding initial evidence into LexDB...');
            await Models.Evidence.insertMany(MOCK_EVIDENCE);
        }
    }
};

module.exports = Models;
