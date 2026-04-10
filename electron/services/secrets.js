const fs = require('node:fs');
const path = require('node:path');

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

class SecretStore {
  constructor(filePath, safeStorage) {
    this.filePath = filePath;
    this.safeStorage = safeStorage;
    ensureDir(filePath);
  }

  readAll() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  writeAll(payload) {
    fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2), 'utf8');
  }

  encode(value) {
    if (!value) {
      return null;
    }
    if (this.safeStorage?.isEncryptionAvailable?.()) {
      return {
        mode: 'safeStorage',
        value: this.safeStorage.encryptString(value).toString('base64'),
      };
    }
    return {
      mode: 'base64',
      value: Buffer.from(value, 'utf8').toString('base64'),
    };
  }

  decode(record) {
    if (!record || !record.value) {
      return '';
    }
    if (record.mode === 'safeStorage' && this.safeStorage?.decryptString) {
      return this.safeStorage.decryptString(Buffer.from(record.value, 'base64'));
    }
    return Buffer.from(record.value, 'base64').toString('utf8');
  }

  getApiKey(profileId) {
    if (!profileId) {
      return '';
    }
    const payload = this.readAll();
    return this.decode(payload[profileId]);
  }

  setApiKey(profileId, apiKey) {
    const payload = this.readAll();
    payload[profileId] = this.encode(apiKey);
    this.writeAll(payload);
  }

  deleteApiKey(profileId) {
    if (!profileId) {
      return;
    }
    const payload = this.readAll();
    delete payload[profileId];
    this.writeAll(payload);
  }
}

module.exports = {
  SecretStore,
};
