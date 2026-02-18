"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("@colyseus/auth");
const bcrypt = __importStar(require("bcryptjs"));
const logger_1 = __importDefault(require("./logger"));
const fakeDb = [];
const BCRYPT_ROUNDS = process.env.NODE_ENV === "production" ? 12 : 10;
// Find user by email (for login)
auth_1.auth.settings.onFindUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const userFound = fakeDb.find((user) => user.email === email);
    // Log without exposing password
    if (process.env.NODE_ENV === "development") {
        logger_1.default.debug("Finding user by email", { email, found: !!userFound });
    }
    // Return user object without the password hash
    if (!userFound)
        return null;
    const { passwordHash } = userFound, userWithoutPassword = __rest(userFound, ["passwordHash"]);
    return userWithoutPassword;
});
// Register with email and password
auth_1.auth.settings.onRegisterWithEmailAndPassword = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    // Hash the password with bcrypt
    const passwordHash = yield bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = {
        email,
        passwordHash,
        name: email.split("@")[0],
        createdAt: new Date().toISOString(),
    };
    // Store the user object
    fakeDb.push(JSON.parse(JSON.stringify(user)));
    // Return without password
    const { passwordHash: _ } = user, userWithoutPassword = __rest(user, ["passwordHash"]);
    return userWithoutPassword;
});
// Register anonymously
auth_1.auth.settings.onRegisterAnonymously = (options) => __awaiter(void 0, void 0, void 0, function* () {
    return Object.assign({ anonymousId: Math.round(Math.random() * 1000000), anonymous: true, createdAt: new Date().toISOString() }, options);
});
exports.default = auth_1.auth;
