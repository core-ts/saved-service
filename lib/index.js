"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ArrayRepository = (function () {
  function ArrayRepository(select, execute, table, field, id) {
    this.select = select;
    this.execute = execute;
    this.table = table;
    this.field = field;
    this.id = id && id.length > 0 ? id : "id";
    this.load = this.load.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
  }
  ArrayRepository.prototype.load = function (id) {
    return this.select("select " + this.id + " as id, " + this.field + " as items from " + this.table + " where " + this.id + " = $1", [id]).then(function (objs) {
      if (objs && objs.length > 0) {
        if (objs[0].items && objs[0].items.length > 0) {
          return objs[0].items;
        }
        else {
          return [];
        }
      }
      else {
        return null;
      }
    });
  };
  ArrayRepository.prototype.insert = function (id, arr) {
    var sql = "insert into " + this.table + "(" + this.id + ", " + this.field + ") values ($1, $2)";
    return this.execute(sql, [id, arr]);
  };
  ArrayRepository.prototype.update = function (id, arr) {
    var sql = "update " + this.table + " set " + this.field + " = $1 where " + this.id + " = $2";
    return this.execute(sql, [arr, id]);
  };
  return ArrayRepository;
}());
exports.ArrayRepository = ArrayRepository;
var SqlSavedRepository = (function () {
  function SqlSavedRepository(db, table, userId, id, saveAt) {
    this.db = db;
    this.table = table;
    this.userId = userId;
    this.id = id;
    this.saveAt = saveAt;
    this.isSaved = this.isSaved.bind(this);
    this.save = this.save.bind(this);
    this.remove = this.remove.bind(this);
    this.count = this.count.bind(this);
  }
  SqlSavedRepository.prototype.isSaved = function (userId, id) {
    var sql = "select " + this.userId + " from " + this.table + " where " + this.userId + " = " + this.db.param(1) + " and " + this.id + " = " + this.db.param(2);
    return this.db.query(sql, [userId, id]).then(function (rows) {
      return rows.length > 0 ? true : false;
    });
  };
  SqlSavedRepository.prototype.save = function (userId, id) {
    var sql = "insert into " + this.table + " (" + this.userId + ", " + this.id + ", " + this.saveAt + ") values (" + this.db.param(1) + ", " + this.db.param(2) + ", " + this.db.param(3) + ") on conflict (" + this.userId + ", " + this.id + ") do nothing";
    return this.db.execute(sql, [userId, id, new Date()]);
  };
  SqlSavedRepository.prototype.remove = function (userId, id) {
    var sql = "delete from " + this.table + " where " + this.userId + " = " + this.db.param(1) + " and " + this.id + " = " + this.db.param(2);
    return this.db.execute(sql, [userId, id]);
  };
  SqlSavedRepository.prototype.count = function (userId) {
    var sql = "select count(*) as total from " + this.table + " where " + this.userId + " = " + this.db.param(1);
    return this.db.query(sql, [userId]).then(function (rows) {
      return rows[0]["total"];
    });
  };
  return SqlSavedRepository;
}());
exports.SqlSavedRepository = SqlSavedRepository;
var SavedService = (function () {
  function SavedService(savedRepository, max) {
    this.savedRepository = savedRepository;
    this.max = max;
    this.isSaved = this.isSaved.bind(this);
    this.save = this.save.bind(this);
    this.remove = this.remove.bind(this);
  }
  SavedService.prototype.isSaved = function (userId, id) {
    return this.savedRepository.isSaved(userId, id);
  };
  SavedService.prototype.save = function (userId, id) {
    var _this = this;
    return this.savedRepository.count(userId).then(function (count) {
      if (count >= _this.max) {
        return -1;
      }
      else {
        return _this.savedRepository.save(userId, id);
      }
    });
  };
  SavedService.prototype.remove = function (userId, id) {
    return this.savedRepository.remove(userId, id);
  };
  return SavedService;
}());
exports.SavedService = SavedService;
exports.SavedUseCase = SavedService;
