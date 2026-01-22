const { v4: uuidv4 } = require('uuid');

class Document {
  constructor(title, type, content, tags = []) {
    this._id = uuidv4();
    this.title = title;
    this.type = type;     
    this.content = content;
    this.tags = tags;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  update(title, content, tags) {
    if (title !== undefined) this.title = title;
    if (content !== undefined) this.content = content;
    if (tags !== undefined) this.tags = tags;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      _id: this._id,
      title: this.title,
      type: this.type,
      content: this.content,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(data) {
    const doc = new Document(data.title, data.type, data.content, data.tags);
    doc._id = data._id;
    doc.createdAt = new Date(data.createdAt);
    doc.updatedAt = new Date(data.updatedAt);
    return doc;
  }
}

module.exports = Document;