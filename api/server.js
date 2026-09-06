var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/lib/supabase-utils.ts
function normalizeSupabaseUrl(url) {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}
var init_supabase_utils = __esm({
  "src/lib/supabase-utils.ts"() {
    "use strict";
  }
});

// src/lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";
async function isUserAdmin(userId) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("user_profiles").select("is_admin").eq("id", userId).single();
  if (error || !data) return false;
  return data.is_admin === true;
}
var createServerSupabase;
var init_supabase_server = __esm({
  "src/lib/supabase-server.ts"() {
    "use strict";
    init_supabase_utils();
    createServerSupabase = () => createClient(
      normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
});

// server/middleware.ts
var middleware_exports = {};
__export(middleware_exports, {
  createUserClient: () => createUserClient,
  getBearerToken: () => getBearerToken,
  getUserFromRequest: () => getUserFromRequest,
  requireAdmin: () => requireAdmin,
  requireAuth: () => requireAuth
});
import { createClient as createClient2 } from "@supabase/supabase-js";
function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}
function createUserClient(req) {
  const token = getBearerToken(req);
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient2(normalizeSupabaseUrl(SUPABASE_URL), SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}
async function getUserFromRequest(req) {
  const client = createUserClient(req);
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
async function requireAuth(req, res, next) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.locals.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}
async function requireAdmin(req, res, next) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const admin = await isUserAdmin(user.id);
    if (!admin) {
      res.status(403).json({ error: "Forbidden: Admin access required" });
      return;
    }
    res.locals.user = user;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ error: "Authorization check failed" });
  }
}
var SUPABASE_URL, SUPABASE_ANON_KEY;
var init_middleware = __esm({
  "server/middleware.ts"() {
    "use strict";
    init_supabase_server();
    init_supabase_utils();
    SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
});

// src/ai/genkit.ts
var genkit_exports = {};
__export(genkit_exports, {
  ai: () => ai
});
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
var ai;
var init_genkit = __esm({
  "src/ai/genkit.ts"() {
    "use strict";
    ai = genkit({
      plugins: [
        googleAI({
          apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY
        })
      ],
      model: "googleai/gemini-3.6-flash"
    });
  }
});

// node_modules/ip-address/dist/address-error.js
var require_address_error = __commonJS({
  "node_modules/ip-address/dist/address-error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AddressError = void 0;
    var AddressError = class extends Error {
      constructor(message, parseMessage) {
        super(message);
        this.name = "AddressError";
        this.parseMessage = parseMessage;
      }
    };
    exports.AddressError = AddressError;
  }
});

// node_modules/ip-address/dist/common.js
var require_common = __commonJS({
  "node_modules/ip-address/dist/common.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isInSubnet = isInSubnet;
    exports.isHostInSubnet = isHostInSubnet;
    exports.isCorrect = isCorrect;
    exports.prefixLengthFromMask = prefixLengthFromMask;
    exports.assertByteArray = assertByteArray;
    exports.numberToPaddedHex = numberToPaddedHex;
    exports.stringToPaddedHex = stringToPaddedHex;
    exports.testBit = testBit;
    var address_error_1 = require_address_error();
    function isInSubnet(address) {
      if (this.subnetMask < address.subnetMask) {
        return false;
      }
      return isHostInSubnet.call(this, address);
    }
    function isHostInSubnet(address) {
      return this.mask(address.subnetMask) === address.mask();
    }
    function isCorrect(defaultBits) {
      return function isCorrectForm() {
        if (this.addressMinusSuffix !== this.correctForm()) {
          return false;
        }
        if (this.subnetMask === defaultBits && !this.parsedSubnet) {
          return true;
        }
        return this.parsedSubnet === String(this.subnetMask);
      };
    }
    function prefixLengthFromMask(value, totalBits) {
      const binary = value.toString(2).padStart(totalBits, "0");
      if (binary.length > totalBits) {
        throw new address_error_1.AddressError("Invalid subnet mask.");
      }
      const firstZero = binary.indexOf("0");
      if (firstZero === -1) {
        return totalBits;
      }
      if (binary.slice(firstZero).includes("1")) {
        throw new address_error_1.AddressError("Invalid subnet mask.");
      }
      return firstZero;
    }
    function assertByteArray(bytes, byteCount, family, minimum) {
      if (bytes.length !== byteCount) {
        throw new address_error_1.AddressError(`${family} addresses require exactly ${byteCount} bytes`);
      }
      for (let i = 0; i < bytes.length; i++) {
        if (!Number.isInteger(bytes[i]) || bytes[i] < minimum || bytes[i] > 255) {
          throw new address_error_1.AddressError(`All bytes must be integers between ${minimum} and 255`);
        }
      }
    }
    function numberToPaddedHex(number) {
      return number.toString(16).padStart(2, "0");
    }
    function stringToPaddedHex(numberString) {
      return numberToPaddedHex(parseInt(numberString, 10));
    }
    function testBit(binaryValue, position) {
      const { length } = binaryValue;
      if (position > length) {
        return false;
      }
      const positionInString = length - position;
      return binaryValue.substring(positionInString, positionInString + 1) === "1";
    }
  }
});

// node_modules/ip-address/dist/v4/constants.js
var require_constants = __commonJS({
  "node_modules/ip-address/dist/v4/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RE_SUBNET_STRING = exports.RE_ADDRESS = exports.GROUPS = exports.BITS = void 0;
    exports.BITS = 32;
    exports.GROUPS = 4;
    exports.RE_ADDRESS = /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/g;
    exports.RE_SUBNET_STRING = /\/\d{1,2}$/;
  }
});

// node_modules/ip-address/dist/ipv4.js
var require_ipv4 = __commonJS({
  "node_modules/ip-address/dist/ipv4.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Address4 = void 0;
    var common = __importStar(require_common());
    var constants = __importStar(require_constants());
    var address_error_1 = require_address_error();
    var isCorrect4 = common.isCorrect(constants.BITS);
    var Address4 = class _Address4 {
      constructor(address) {
        this.addressMinusSuffix = "";
        this.groups = constants.GROUPS;
        this.parsedAddress = [];
        this.parsedSubnet = "";
        this.subnet = "/32";
        this.subnetMask = 32;
        this.v4 = true;
        this.isCorrect = isCorrect4;
        this.isInSubnet = common.isInSubnet;
        this.isHostInSubnet = common.isHostInSubnet;
        this.address = address;
        const subnet = constants.RE_SUBNET_STRING.exec(address);
        if (subnet) {
          this.parsedSubnet = subnet[0].replace("/", "");
          this.subnetMask = parseInt(this.parsedSubnet, 10);
          this.subnet = `/${this.subnetMask}`;
          if (this.subnetMask < 0 || this.subnetMask > constants.BITS) {
            throw new address_error_1.AddressError("Invalid subnet mask.");
          }
          address = address.replace(constants.RE_SUBNET_STRING, "");
        }
        this.addressMinusSuffix = address;
        this.parsedAddress = this.parse(address);
      }
      /**
       * Returns true if the given string is a valid IPv4 address (with optional
       * CIDR subnet), false otherwise. Host bits in the subnet portion are
       * allowed (e.g. `192.168.1.5/24` is valid); for strict network-address
       * validation compare `correctForm()` to `startAddress().correctForm()`,
       * or use `networkForm()`.
       */
      static isValid(address) {
        try {
          new _Address4(address);
          return true;
        } catch {
          return false;
        }
      }
      /**
       * Parses an IPv4 address string into its four octet groups and stores the
       * result on `this.parsedAddress`. Called automatically by the constructor;
       * you typically don't need to call it directly. Throws `AddressError` if
       * the input is not a valid IPv4 address.
       */
      parse(address) {
        const groups = address.split(".");
        if (groups.some((group) => /^0\d/.test(group))) {
          throw new address_error_1.AddressError("IPv4 addresses can't have leading zeroes.");
        }
        if (!address.match(constants.RE_ADDRESS)) {
          throw new address_error_1.AddressError("Invalid IPv4 address.");
        }
        return groups;
      }
      /**
       * Returns the address in correct form: octets joined with `.` and any
       * leading zeros stripped (e.g. `192.168.1.1`). For IPv4 this matches the
       * canonical dotted-decimal representation.
       */
      correctForm() {
        return this.parsedAddress.map((part) => parseInt(part, 10)).join(".");
      }
      /**
       * Construct an `Address4` from an address and a dotted-decimal subnet
       * mask given as separate strings (e.g. as returned by Node's
       * `os.networkInterfaces()`). Throws `AddressError` if the mask is
       * non-contiguous (e.g. `255.0.255.0`).
       * @example
       * var address = Address4.fromAddressAndMask('192.168.1.1', '255.255.255.0');
       * address.subnetMask; // 24
       */
      static fromAddressAndMask(address, mask) {
        const bits = common.prefixLengthFromMask(new _Address4(mask).bigInt(), constants.BITS);
        return new _Address4(`${address}/${bits}`);
      }
      /**
       * Construct an `Address4` from an address and a Cisco-style wildcard mask
       * given as separate strings (e.g. `0.0.0.255` for a `/24`). The wildcard
       * mask is the bitwise inverse of the subnet mask. Throws `AddressError`
       * if the mask is non-contiguous (e.g. `0.255.0.255`).
       * @example
       * var address = Address4.fromAddressAndWildcardMask('10.0.0.1', '0.0.0.255');
       * address.subnetMask; // 24
       */
      static fromAddressAndWildcardMask(address, wildcardMask) {
        const wildcard = new _Address4(wildcardMask).bigInt();
        const allOnes = (BigInt(1) << BigInt(constants.BITS)) - BigInt(1);
        const mask = wildcard ^ allOnes;
        const bits = common.prefixLengthFromMask(mask, constants.BITS);
        return new _Address4(`${address}/${bits}`);
      }
      /**
       * Construct an `Address4` from a wildcard pattern with trailing `*`
       * octets. The number of trailing wildcards determines the prefix
       * length: each `*` represents 8 bits.
       *
       * Only trailing whole-octet wildcards are supported. Partial-octet
       * wildcards (e.g. `192.168.0.1*`) and interior wildcards (e.g.
       * `192.*.0.1`) throw `AddressError`.
       * @example
       * Address4.fromWildcard('192.168.0.*').subnet;   // '/24'
       * Address4.fromWildcard('192.168.*.*').subnet;   // '/16'
       * Address4.fromWildcard('*.*.*.*').subnet;       // '/0'
       */
      static fromWildcard(input) {
        const groups = input.split(".");
        if (groups.length !== constants.GROUPS) {
          throw new address_error_1.AddressError("Wildcard pattern must have 4 octets");
        }
        let firstWildcard = -1;
        for (let i = 0; i < groups.length; i++) {
          if (groups[i] === "*") {
            if (firstWildcard === -1) {
              firstWildcard = i;
            }
          } else if (firstWildcard !== -1) {
            throw new address_error_1.AddressError("Wildcard `*` must only appear in trailing octets (e.g. `192.168.0.*`)");
          }
        }
        const trailing = firstWildcard === -1 ? 0 : groups.length - firstWildcard;
        const replaced = groups.map((g) => g === "*" ? "0" : g);
        const subnetBits = constants.BITS - trailing * 8;
        return new _Address4(`${replaced.join(".")}/${subnetBits}`);
      }
      /**
       * Converts a hex string to an IPv4 address object. Accepts 8 hex digits
       * with optional `:` separators (e.g. `'7f000001'` or `'7f:00:00:01'`).
       * Throws `AddressError` for any other length or for non-hex characters.
       * @param {string} hex - a hex string to convert
       * @returns {Address4}
       */
      static fromHex(hex) {
        const stripped = hex.replace(/:/g, "");
        if (!/^[0-9a-fA-F]{8}$/.test(stripped)) {
          throw new address_error_1.AddressError("IPv4 hex must be exactly 8 hex digits");
        }
        const groups = [];
        for (let i = 0; i < 8; i += 2) {
          groups.push(parseInt(stripped.slice(i, i + 2), 16));
        }
        return new _Address4(groups.join("."));
      }
      /**
       * Converts an integer into a IPv4 address object. The integer must be a
       * non-negative safe integer in the range `[0, 2**32 - 1]`; otherwise
       * `AddressError` is thrown.
       * @param {integer} integer - a number to convert
       * @returns {Address4}
       */
      static fromInteger(integer) {
        if (!Number.isInteger(integer) || integer < 0 || integer > 4294967295) {
          throw new address_error_1.AddressError("IPv4 integer must be in the range 0 to 2**32 - 1");
        }
        return _Address4.fromHex(integer.toString(16).padStart(8, "0"));
      }
      /**
       * Return an address from in-addr.arpa form
       * @param {string} arpaFormAddress - an 'in-addr.arpa' form ipv4 address
       * @returns {Adress4}
       * @example
       * var address = Address4.fromArpa(42.2.0.192.in-addr.arpa.)
       * address.correctForm(); // '192.0.2.42'
       */
      static fromArpa(arpaFormAddress) {
        const leader = arpaFormAddress.replace(/(\.in-addr\.arpa)?\.$/, "");
        const address = leader.split(".").reverse().join(".");
        return new _Address4(address);
      }
      /**
       * Converts an IPv4 address object to a hex string
       * @returns {String}
       */
      toHex() {
        return this.parsedAddress.map((part) => common.stringToPaddedHex(part)).join(":");
      }
      /**
       * Converts an IPv4 address object to an array of bytes.
       *
       * To get a Node.js `Buffer`, wrap the result: `Buffer.from(address.toArray())`.
       * @returns {Array}
       */
      toArray() {
        return this.parsedAddress.map((part) => parseInt(part, 10));
      }
      /**
       * Converts an IPv4 address object to an IPv6 address group
       * @returns {String}
       */
      toGroup6() {
        const output = [];
        let i;
        for (i = 0; i < constants.GROUPS; i += 2) {
          output.push(`${common.stringToPaddedHex(this.parsedAddress[i])}${common.stringToPaddedHex(this.parsedAddress[i + 1])}`);
        }
        return output.join(":");
      }
      /**
       * Returns the address as a `bigint`
       * @returns {bigint}
       */
      bigInt() {
        return BigInt(`0x${this.parsedAddress.map((n) => common.stringToPaddedHex(n)).join("")}`);
      }
      /**
       * Helper function getting start address.
       * @returns {bigint}
       */
      _startAddress() {
        return BigInt(`0b${this.mask() + "0".repeat(constants.BITS - this.subnetMask)}`);
      }
      /**
       * The first address in the range given by this address' subnet.
       * Often referred to as the Network Address.
       * @returns {Address4}
       */
      startAddress() {
        return _Address4.fromBigInt(this._startAddress());
      }
      /**
       * The first host address in the range given by this address's subnet ie
       * the first address after the Network Address
       * @returns {Address4}
       */
      startAddressExclusive() {
        const adjust = BigInt("1");
        return _Address4.fromBigInt(this._startAddress() + adjust);
      }
      /**
       * Helper function getting end address.
       * @returns {bigint}
       */
      _endAddress() {
        return BigInt(`0b${this.mask() + "1".repeat(constants.BITS - this.subnetMask)}`);
      }
      /**
       * The last address in the range given by this address' subnet
       * Often referred to as the Broadcast
       * @returns {Address4}
       */
      endAddress() {
        return _Address4.fromBigInt(this._endAddress());
      }
      /**
       * The last host address in the range given by this address's subnet ie
       * the last address prior to the Broadcast Address
       * @returns {Address4}
       */
      endAddressExclusive() {
        const adjust = BigInt("1");
        return _Address4.fromBigInt(this._endAddress() - adjust);
      }
      /**
       * The dotted-decimal form of the subnet mask, e.g. `255.255.240.0` for
       * a `/20`. Returns an `Address4`; call `.correctForm()` for the string.
       * @returns {Address4}
       */
      subnetMaskAddress() {
        return _Address4.fromBigInt(BigInt(`0b${"1".repeat(this.subnetMask)}${"0".repeat(constants.BITS - this.subnetMask)}`));
      }
      /**
       * The Cisco-style wildcard mask, e.g. `0.0.0.255` for a `/24`. This is
       * the bitwise inverse of `subnetMaskAddress()`. Returns an `Address4`;
       * call `.correctForm()` for the string.
       * @returns {Address4}
       */
      wildcardMask() {
        return _Address4.fromBigInt(BigInt(`0b${"0".repeat(this.subnetMask)}${"1".repeat(constants.BITS - this.subnetMask)}`));
      }
      /**
       * The network address in CIDR string form, e.g. `192.168.1.0/24` for
       * `192.168.1.5/24`. For an address with no explicit subnet the prefix is
       * `/32`, e.g. `networkForm()` on `192.168.1.5` returns `192.168.1.5/32`.
       * @returns {string}
       */
      networkForm() {
        return `${this.startAddress().correctForm()}/${this.subnetMask}`;
      }
      /**
       * Converts a BigInt to a v4 address object. The value must be in the
       * range `[0, 2**32 - 1]`; otherwise `AddressError` is thrown.
       * @param {bigint} bigInt - a BigInt to convert
       * @returns {Address4}
       */
      static fromBigInt(bigInt) {
        if (bigInt < BigInt(0) || bigInt > BigInt(4294967295)) {
          throw new address_error_1.AddressError("IPv4 BigInt must be in the range 0 to 2**32 - 1");
        }
        return _Address4.fromHex(bigInt.toString(16).padStart(8, "0"));
      }
      /**
       * Convert a byte array to an Address4 object. Throws `AddressError` unless
       * given exactly 4 integers from 0 to 255. Signed bytes are rejected, so
       * this differs from `Address6.fromByteArray`, which folds them; the two
       * contracts converge on this stricter form in the next major version.
       *
       * To convert from a Node.js `Buffer`, spread it: `Address4.fromByteArray([...buf])`.
       * @param {Array<number>} bytes - an array of 4 bytes (0-255)
       * @returns {Address4}
       */
      static fromByteArray(bytes) {
        common.assertByteArray(bytes, 4, "IPv4", 0);
        return this.fromUnsignedByteArray(bytes);
      }
      /**
       * Convert an unsigned byte array to an Address4 object. Throws
       * `AddressError` unless given exactly 4 bytes, and rejects values outside
       * 0 to 255 when parsing the resulting address.
       *
       * To convert from a Node.js `Buffer`, spread it:
       * `Address4.fromUnsignedByteArray([...buf])`.
       * @param {Array<number>} bytes - an array of 4 unsigned bytes (0-255)
       * @returns {Address4}
       */
      static fromUnsignedByteArray(bytes) {
        if (bytes.length !== 4) {
          throw new address_error_1.AddressError("IPv4 addresses require exactly 4 bytes");
        }
        const address = bytes.join(".");
        return new _Address4(address);
      }
      /**
       * Returns the first n bits of the address, defaulting to the
       * subnet mask
       * @returns {String}
       */
      mask(mask) {
        if (mask === void 0) {
          mask = this.subnetMask;
        }
        return this.getBitsBase2(0, mask);
      }
      /**
       * Returns the bits in the given range as a base-2 string
       * @returns {string}
       */
      getBitsBase2(start, end) {
        return this.binaryZeroPad().slice(start, end);
      }
      /**
       * Return the reversed in-addr.arpa form of the address, e.g.
       * `42.2.0.192.in-addr.arpa.` for `192.0.2.42`.
       * @param {Object} options
       * @param {boolean} options.omitSuffix - omit the "in-addr.arpa" suffix
       * @returns {String}
       */
      reverseForm(options) {
        if (!options) {
          options = {};
        }
        const reversed = this.correctForm().split(".").reverse().join(".");
        if (options.omitSuffix) {
          return reversed;
        }
        return `${reversed}.in-addr.arpa.`;
      }
      /**
       * Returns true if the given address is a multicast address
       * @returns {boolean}
       */
      isMulticast() {
        return this.isHostInSubnet(MULTICAST_V4);
      }
      /**
       * Returns true if the address is in one of the [RFC 1918](https://datatracker.ietf.org/doc/html/rfc1918) private address ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
       * @returns {boolean}
       */
      isPrivate() {
        return PRIVATE_V4.some((subnet) => this.isHostInSubnet(subnet));
      }
      /**
       * Returns true if the address is in the loopback range `127.0.0.0/8` ([RFC 1122](https://datatracker.ietf.org/doc/html/rfc1122)).
       * @returns {boolean}
       */
      isLoopback() {
        return this.isHostInSubnet(LOOPBACK_V4);
      }
      /**
       * Returns true if the address is in the link-local range `169.254.0.0/16` ([RFC 3927](https://datatracker.ietf.org/doc/html/rfc3927)).
       * @returns {boolean}
       */
      isLinkLocal() {
        return this.isHostInSubnet(LINK_LOCAL_V4);
      }
      /**
       * Returns true if the address is the unspecified address `0.0.0.0`.
       * @returns {boolean}
       */
      isUnspecified() {
        return this.isHostInSubnet(UNSPECIFIED_V4);
      }
      /**
       * Returns true if the address is the limited broadcast address `255.255.255.255` ([RFC 919](https://datatracker.ietf.org/doc/html/rfc919)).
       * @returns {boolean}
       */
      isBroadcast() {
        return this.isHostInSubnet(BROADCAST_V4);
      }
      /**
       * Returns true if the address is in the carrier-grade NAT range `100.64.0.0/10` ([RFC 6598](https://datatracker.ietf.org/doc/html/rfc6598)).
       * @returns {boolean}
       */
      isCGNAT() {
        return this.isHostInSubnet(CGNAT_V4);
      }
      /**
       * Returns a zero-padded base-2 string representation of the address
       * @returns {string}
       */
      binaryZeroPad() {
        if (this._binaryZeroPad === void 0) {
          this._binaryZeroPad = this.bigInt().toString(2).padStart(constants.BITS, "0");
        }
        return this._binaryZeroPad;
      }
      /**
       * Groups an IPv4 address for inclusion at the end of an IPv6 address.
       *
       * Returns an HTML fragment: each half of the address is wrapped in a
       * `<span>` carrying the group classes an address-inspector UI hovers on.
       * The address content is HTML-escaped; anything you concatenate around it
       * is your responsibility.
       * @returns {String}
       */
      groupForV6() {
        const segments = this.parsedAddress;
        return this.correctForm().replace(constants.RE_ADDRESS, `<span class="hover-group group-v4 group-6">${segments.slice(0, 2).join(".")}</span>.<span class="hover-group group-v4 group-7">${segments.slice(2, 4).join(".")}</span>`);
      }
    };
    exports.Address4 = Address4;
    var MULTICAST_V4 = new Address4("224.0.0.0/4");
    var PRIVATE_V4 = [
      new Address4("10.0.0.0/8"),
      new Address4("172.16.0.0/12"),
      new Address4("192.168.0.0/16")
    ];
    var LOOPBACK_V4 = new Address4("127.0.0.0/8");
    var LINK_LOCAL_V4 = new Address4("169.254.0.0/16");
    var UNSPECIFIED_V4 = new Address4("0.0.0.0/32");
    var BROADCAST_V4 = new Address4("255.255.255.255/32");
    var CGNAT_V4 = new Address4("100.64.0.0/10");
  }
});

// node_modules/ip-address/dist/v6/constants.js
var require_constants2 = __commonJS({
  "node_modules/ip-address/dist/v6/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RE_URL_WITH_PORT = exports.RE_URL = exports.RE_ZONE_STRING = exports.RE_SUBNET_STRING = exports.RE_BAD_ADDRESS = exports.RE_BAD_CHARACTERS = exports.TYPES = exports.SCOPES = exports.GROUPS = exports.BITS = void 0;
    exports.BITS = 128;
    exports.GROUPS = 8;
    exports.SCOPES = {
      0: "Reserved",
      1: "Interface local",
      2: "Link local",
      4: "Admin local",
      5: "Site local",
      8: "Organization local",
      14: "Global",
      15: "Reserved"
    };
    exports.TYPES = {
      "ff01::1/128": "Multicast (All nodes on this interface)",
      "ff01::2/128": "Multicast (All routers on this interface)",
      "ff02::1/128": "Multicast (All nodes on this link)",
      "ff02::2/128": "Multicast (All routers on this link)",
      "ff05::2/128": "Multicast (All routers in this site)",
      "ff02::5/128": "Multicast (OSPFv3 AllSPF routers)",
      "ff02::6/128": "Multicast (OSPFv3 AllDR routers)",
      "ff02::9/128": "Multicast (RIP routers)",
      "ff02::a/128": "Multicast (EIGRP routers)",
      "ff02::d/128": "Multicast (PIM routers)",
      "ff02::16/128": "Multicast (MLDv2 reports)",
      "ff01::fb/128": "Multicast (mDNSv6)",
      "ff02::fb/128": "Multicast (mDNSv6)",
      "ff05::fb/128": "Multicast (mDNSv6)",
      "ff02::1:2/128": "Multicast (All DHCP servers and relay agents on this link)",
      "ff05::1:2/128": "Multicast (All DHCP servers and relay agents in this site)",
      "ff02::1:3/128": "Multicast (All DHCP servers on this link)",
      "ff05::1:3/128": "Multicast (All DHCP servers in this site)",
      "::/128": "Unspecified",
      "::1/128": "Loopback",
      "::ffff:0:0/96": "IPv4-mapped",
      "ff00::/8": "Multicast",
      "fe80::/10": "Link-local unicast",
      "fc00::/7": "Unique local",
      "2002::/16": "6to4",
      "2001:db8::/32": "Documentation",
      "64:ff9b::/96": "NAT64 (well-known)",
      "64:ff9b:1::/48": "NAT64 (local-use)"
    };
    exports.RE_BAD_CHARACTERS = /([^0-9a-f:/%])/gi;
    exports.RE_BAD_ADDRESS = /([0-9a-f]{5,}|:{3,}|[^:]:$|^:[^:]|\/$)/gi;
    exports.RE_SUBNET_STRING = /\/\d{1,3}(?=%|$)/;
    exports.RE_ZONE_STRING = /%.*$/;
    exports.RE_URL = /^(?:\[([0-9a-f:.]+)\]|([0-9a-f:.]+))(?:[/?#].*)?$/i;
    exports.RE_URL_WITH_PORT = /^\[([0-9a-f:.]+)\]:([0-9]{1,5})(?:[/?#].*)?$/i;
  }
});

// node_modules/ip-address/dist/v6/helpers.js
var require_helpers = __commonJS({
  "node_modules/ip-address/dist/v6/helpers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.escapeHtml = escapeHtml;
    exports.spanAllZeroes = spanAllZeroes;
    exports.spanAll = spanAll;
    exports.spanLeadingZeroes = spanLeadingZeroes;
    exports.simpleGroup = simpleGroup;
    function escapeHtml(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function spanAllZeroes(s) {
      return escapeHtml(s).replace(/(0+)/g, '<span class="zero">$1</span>');
    }
    function spanAll(s, offset = 0) {
      const letters = s.split("");
      return letters.map((n, i) => `<span class="digit value-${escapeHtml(n)} position-${i + offset}">${spanAllZeroes(n)}</span>`).join("");
    }
    function spanLeadingZeroesSimple(group) {
      return escapeHtml(group).replace(/^(0+)/, '<span class="zero">$1</span>');
    }
    function spanLeadingZeroes(address) {
      const groups = address.split(":");
      return groups.map((g) => spanLeadingZeroesSimple(g)).join(":");
    }
    function simpleGroup(addressString, offset = 0) {
      const groups = addressString.split(":");
      return groups.map((g, i) => {
        if (/group-v4/.test(g)) {
          return g;
        }
        return `<span class="hover-group group-${i + offset}">${spanLeadingZeroesSimple(g)}</span>`;
      });
    }
  }
});

// node_modules/ip-address/dist/v6/regular-expressions.js
var require_regular_expressions = __commonJS({
  "node_modules/ip-address/dist/v6/regular-expressions.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ADDRESS_BOUNDARY = void 0;
    exports.groupPossibilities = groupPossibilities;
    exports.padGroup = padGroup;
    exports.simpleRegularExpression = simpleRegularExpression;
    exports.possibleElisions = possibleElisions;
    var v6 = __importStar(require_constants2());
    function groupPossibilities(possibilities) {
      return `(${possibilities.join("|")})`;
    }
    function padGroup(group) {
      if (group.length < 4) {
        return `0{0,${4 - group.length}}${group}`;
      }
      return group;
    }
    exports.ADDRESS_BOUNDARY = "[^A-Fa-f0-9:]";
    function simpleRegularExpression(groups) {
      const zeroIndexes = [];
      groups.forEach((group, i) => {
        const groupInteger = parseInt(group, 16);
        if (groupInteger === 0) {
          zeroIndexes.push(i);
        }
      });
      const possibilities = zeroIndexes.map((zeroIndex) => groups.map((group, i) => {
        if (i === zeroIndex) {
          const elision = i === 0 || i === v6.GROUPS - 1 ? ":" : "";
          return groupPossibilities([padGroup(group), elision]);
        }
        return padGroup(group);
      }).join(":"));
      possibilities.push(groups.map(padGroup).join(":"));
      return groupPossibilities(possibilities);
    }
    function possibleElisions(elidedGroups, moreLeft, moreRight) {
      const left = moreLeft ? "" : ":";
      const right = moreRight ? "" : ":";
      const possibilities = [];
      if (!moreLeft && !moreRight) {
        possibilities.push("::");
      }
      if (moreLeft && moreRight) {
        possibilities.push("");
      }
      if (moreRight && !moreLeft || !moreRight && moreLeft) {
        possibilities.push(":");
      }
      possibilities.push(`${left}(:0{1,4}){1,${elidedGroups - 1}}`);
      possibilities.push(`(0{1,4}:){1,${elidedGroups - 1}}${right}`);
      possibilities.push(`(0{1,4}:){${elidedGroups - 1}}0{1,4}`);
      for (let groups = 1; groups < elidedGroups - 1; groups++) {
        for (let position = 1; position < elidedGroups - groups; position++) {
          possibilities.push(`(0{1,4}:){${position}}:(0{1,4}:){${elidedGroups - position - groups - 1}}0{1,4}`);
        }
      }
      return groupPossibilities(possibilities);
    }
  }
});

// node_modules/ip-address/dist/ipv6.js
var require_ipv6 = __commonJS({
  "node_modules/ip-address/dist/ipv6.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Address6 = void 0;
    var common = __importStar(require_common());
    var constants4 = __importStar(require_constants());
    var constants6 = __importStar(require_constants2());
    var helpers = __importStar(require_helpers());
    var ipv4_1 = require_ipv4();
    var regular_expressions_1 = require_regular_expressions();
    var address_error_1 = require_address_error();
    var common_1 = require_common();
    var isCorrect6 = common.isCorrect(constants6.BITS);
    function assert(condition) {
      if (!condition) {
        throw new Error("Assertion failed.");
      }
    }
    function addCommas(number) {
      const r = /(\d+)(\d{3})/;
      while (r.test(number)) {
        number = number.replace(r, "$1,$2");
      }
      return number;
    }
    function spanLeadingZeroes4(n) {
      n = n.replace(/^(0{1,})([1-9]+)$/, '<span class="parse-error">$1</span>$2');
      n = n.replace(/^(0{1,})(0)$/, '<span class="parse-error">$1</span>$2');
      return n;
    }
    function compact(address, slice) {
      const s1 = [];
      const s2 = [];
      let i;
      for (i = 0; i < address.length; i++) {
        if (i < slice[0]) {
          s1.push(address[i]);
        } else if (i > slice[1]) {
          s2.push(address[i]);
        }
      }
      return s1.concat(["compact"]).concat(s2);
    }
    function paddedHex(octet) {
      return parseInt(octet, 16).toString(16).padStart(4, "0");
    }
    function unsignByte(b) {
      return b & 255;
    }
    var Address62 = class _Address6 {
      constructor(address, optionalGroups) {
        this.addressMinusSuffix = "";
        this.parsedSubnet = "";
        this.subnet = "/128";
        this.subnetMask = 128;
        this.v4 = false;
        this.zone = "";
        this.isInSubnet = common.isInSubnet;
        this.isHostInSubnet = common.isHostInSubnet;
        this.isCorrect = isCorrect6;
        if (optionalGroups === void 0) {
          this.groups = constants6.GROUPS;
        } else {
          this.groups = optionalGroups;
        }
        this.address = address;
        const subnet = constants6.RE_SUBNET_STRING.exec(address);
        if (subnet) {
          this.parsedSubnet = subnet[0].replace("/", "");
          this.subnetMask = parseInt(this.parsedSubnet, 10);
          this.subnet = `/${this.subnetMask}`;
          if (Number.isNaN(this.subnetMask) || this.subnetMask < 0 || this.subnetMask > constants6.BITS) {
            throw new address_error_1.AddressError("Invalid subnet mask.");
          }
          address = address.replace(constants6.RE_SUBNET_STRING, "");
        }
        if (/\//.test(address)) {
          throw new address_error_1.AddressError("Invalid subnet mask.");
        }
        const zone = constants6.RE_ZONE_STRING.exec(address);
        if (zone) {
          this.zone = zone[0];
          address = address.replace(constants6.RE_ZONE_STRING, "");
        }
        this.addressMinusSuffix = address;
        this.parsedAddress = this.parse(this.addressMinusSuffix);
      }
      /**
       * Returns true if the given string is a valid IPv6 address (with optional
       * CIDR subnet and zone identifier), false otherwise. Host bits in the
       * subnet portion are allowed (e.g. `2001:db8::1/32` is valid); for strict
       * network-address validation compare `correctForm()` to
       * `startAddress().correctForm()`, or use `networkForm()`.
       */
      static isValid(address) {
        try {
          new _Address6(address);
          return true;
        } catch {
          return false;
        }
      }
      /**
       * Convert a BigInt to a v6 address object. The value must be in the
       * range `[0, 2**128 - 1]`; otherwise `AddressError` is thrown.
       * @param {bigint} bigInt - a BigInt to convert
       * @returns {Address6}
       * @example
       * var bigInt = BigInt('1000000000000');
       * var address = Address6.fromBigInt(bigInt);
       * address.correctForm(); // '::e8:d4a5:1000'
       */
      static fromBigInt(bigInt) {
        if (bigInt < BigInt(0) || bigInt > (BigInt(1) << BigInt(constants6.BITS)) - BigInt(1)) {
          throw new address_error_1.AddressError("IPv6 BigInt must be in the range 0 to 2**128 - 1");
        }
        const hex = bigInt.toString(16).padStart(32, "0");
        const groups = [];
        for (let i = 0; i < constants6.GROUPS; i++) {
          groups.push(hex.slice(i * 4, (i + 1) * 4));
        }
        return new _Address6(groups.join(":"));
      }
      /**
       * Parse a URL (with optional bracketed host and port) into an address and
       * port. Returns either `{ address, port }` on success or
       * `{ error, address: null, port: null }` if the URL could not be parsed.
       * Ports are returned as numbers (or `null` if absent or out of range).
       * @example
       * var addressAndPort = Address6.fromURL('http://[ffff::]:8080/foo/');
       * addressAndPort.address.correctForm(); // 'ffff::'
       * addressAndPort.port; // 8080
       */
      static fromURL(url) {
        var _a;
        let host;
        let port = null;
        let result;
        let error;
        const stripped = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
        if (stripped.indexOf("[") !== -1 && stripped.indexOf("]:") !== -1) {
          error = "failed to parse address with port";
          result = constants6.RE_URL_WITH_PORT.exec(stripped);
          if (result === null) {
            return { error, address: null, port: null };
          }
          host = result[1];
          port = result[2];
        } else {
          error = "failed to parse address from URL";
          result = constants6.RE_URL.exec(stripped);
          if (result === null) {
            return { error, address: null, port: null };
          }
          host = (_a = result[1]) !== null && _a !== void 0 ? _a : result[2];
        }
        if (port) {
          port = parseInt(port, 10);
          if (port < 0 || port > 65535) {
            port = null;
          }
        } else {
          port = null;
        }
        let address;
        try {
          address = new _Address6(host);
        } catch {
          return { error, address: null, port: null };
        }
        return { address, port };
      }
      /**
       * Construct an `Address6` from an address and a hex subnet mask given as
       * separate strings (e.g. as returned by Node's `os.networkInterfaces()`).
       * Throws `AddressError` if the mask is non-contiguous (e.g.
       * `ffff::ffff`).
       * @example
       * var address = Address6.fromAddressAndMask('fe80::1', 'ffff:ffff:ffff:ffff::');
       * address.subnetMask; // 64
       */
      static fromAddressAndMask(address, mask) {
        const bits = common.prefixLengthFromMask(new _Address6(mask).bigInt(), constants6.BITS);
        return new _Address6(`${address}/${bits}`);
      }
      /**
       * Construct an `Address6` from an address and a Cisco-style wildcard mask
       * given as separate strings (e.g. `::ffff:ffff:ffff:ffff` for a `/64`).
       * The wildcard mask is the bitwise inverse of the subnet mask. Throws
       * `AddressError` if the mask is non-contiguous.
       * @example
       * var address = Address6.fromAddressAndWildcardMask('fe80::1', '::ffff:ffff:ffff:ffff');
       * address.subnetMask; // 64
       */
      static fromAddressAndWildcardMask(address, wildcardMask) {
        const wildcard = new _Address6(wildcardMask).bigInt();
        const allOnes = (BigInt(1) << BigInt(constants6.BITS)) - BigInt(1);
        const mask = wildcard ^ allOnes;
        const bits = common.prefixLengthFromMask(mask, constants6.BITS);
        return new _Address6(`${address}/${bits}`);
      }
      /**
       * Construct an `Address6` from a wildcard pattern with trailing `*`
       * groups. The number of trailing wildcards determines the prefix
       * length: each `*` represents 16 bits. `::` is expanded to zero groups
       * (not wildcards) before evaluating trailing wildcards.
       *
       * Only trailing whole-group wildcards are supported. Partial-group
       * wildcards (e.g. `2001:db8::0*`) and interior wildcards (e.g.
       * `*::1`) throw `AddressError`.
       * @example
       * Address6.fromWildcard('2001:db8:*:*:*:*:*:*').subnet;  // '/32'
       * Address6.fromWildcard('2001:db8::*').subnet;           // '/112'
       * Address6.fromWildcard('*:*:*:*:*:*:*:*').subnet;       // '/0'
       */
      static fromWildcard(input) {
        if (input.includes("%") || input.includes("/")) {
          throw new address_error_1.AddressError("Wildcard pattern must not include a zone or CIDR suffix");
        }
        const halves = input.split("::");
        if (halves.length > 2) {
          throw new address_error_1.AddressError("Wildcard pattern cannot contain more than one '::'");
        }
        let groups;
        if (halves.length === 2) {
          const left = halves[0] === "" ? [] : halves[0].split(":");
          const right = halves[1] === "" ? [] : halves[1].split(":");
          const remaining = constants6.GROUPS - left.length - right.length;
          if (remaining < 1) {
            throw new address_error_1.AddressError("Wildcard pattern with '::' has too many groups");
          }
          groups = [...left, ...new Array(remaining).fill("0"), ...right];
        } else {
          groups = input.split(":");
        }
        if (groups.length !== constants6.GROUPS) {
          throw new address_error_1.AddressError("Wildcard pattern must have 8 groups");
        }
        let firstWildcard = -1;
        for (let i = 0; i < groups.length; i++) {
          if (groups[i] === "*") {
            if (firstWildcard === -1) {
              firstWildcard = i;
            }
          } else if (firstWildcard !== -1) {
            throw new address_error_1.AddressError("Wildcard `*` must only appear in trailing groups (e.g. `2001:db8:*:*:*:*:*:*`)");
          }
        }
        const trailing = firstWildcard === -1 ? 0 : groups.length - firstWildcard;
        const replaced = groups.map((g) => g === "*" ? "0" : g);
        const subnetBits = constants6.BITS - trailing * 16;
        return new _Address6(`${replaced.join(":")}/${subnetBits}`);
      }
      /**
       * Create an IPv6-mapped address given an IPv4 address
       * @param {string} address - An IPv4 address string
       * @returns {Address6}
       * @example
       * var address = Address6.fromAddress4('192.168.0.1');
       * address.correctForm(); // '::ffff:c0a8:1'
       * address.to4in6(); // '::ffff:192.168.0.1'
       */
      static fromAddress4(address) {
        const address4 = new ipv4_1.Address4(address);
        const mask6 = constants6.BITS - (constants4.BITS - address4.subnetMask);
        return new _Address6(`::ffff:${address4.correctForm()}/${mask6}`);
      }
      /**
       * Return an address from ip6.arpa form
       * @param {string} arpaFormAddress - an 'ip6.arpa' form address
       * @returns {Adress6}
       * @example
       * var address = Address6.fromArpa(e.f.f.f.3.c.2.6.f.f.f.e.6.6.8.e.1.0.6.7.9.4.e.c.0.0.0.0.1.0.0.2.ip6.arpa.)
       * address.correctForm(); // '2001:0:ce49:7601:e866:efff:62c3:fffe'
       */
      static fromArpa(arpaFormAddress) {
        let address = arpaFormAddress.replace(/(\.ip6\.arpa)?\.$/, "");
        const semicolonAmount = 7;
        if (address.length !== 63) {
          throw new address_error_1.AddressError("Invalid 'ip6.arpa' form.");
        }
        const parts = address.split(".").reverse();
        for (let i = semicolonAmount; i > 0; i--) {
          const insertIndex = i * 4;
          parts.splice(insertIndex, 0, ":");
        }
        address = parts.join("");
        return new _Address6(address);
      }
      /**
       * Return the Microsoft UNC transcription of the address
       * @returns {String} the Microsoft UNC transcription of the address
       */
      microsoftTranscription() {
        return `${this.correctForm().replace(/:/g, "-")}.ipv6-literal.net`;
      }
      /**
       * Return the first n bits of the address, defaulting to the subnet mask
       * @param {number} [mask=subnet] - the number of bits to mask
       * @returns {String} the first n bits of the address as a string
       */
      mask(mask = this.subnetMask) {
        return this.getBitsBase2(0, mask);
      }
      /**
       * Return the number of possible subnets of a given size in the address
       * @param {number} [subnetSize=128] - the subnet size
       * @returns {String}
       */
      // TODO: probably useful to have a numeric version of this too
      possibleSubnets(subnetSize = 128) {
        const availableBits = constants6.BITS - this.subnetMask;
        const subnetBits = Math.abs(subnetSize - constants6.BITS);
        const subnetPowers = availableBits - subnetBits;
        if (subnetPowers < 0) {
          return "0";
        }
        return addCommas((BigInt("2") ** BigInt(subnetPowers)).toString(10));
      }
      /**
       * Helper function getting start address.
       * @returns {bigint}
       */
      _startAddress() {
        return BigInt(`0b${this.mask() + "0".repeat(constants6.BITS - this.subnetMask)}`);
      }
      /**
       * The first address in the range given by this address' subnet
       * Often referred to as the Network Address.
       * @returns {Address6}
       */
      startAddress() {
        return _Address6.fromBigInt(this._startAddress());
      }
      /**
       * The first host address in the range given by this address's subnet ie
       * the first address after the Network Address
       * @returns {Address6}
       */
      startAddressExclusive() {
        const adjust = BigInt("1");
        return _Address6.fromBigInt(this._startAddress() + adjust);
      }
      /**
       * Helper function getting end address.
       * @returns {bigint}
       */
      _endAddress() {
        return BigInt(`0b${this.mask() + "1".repeat(constants6.BITS - this.subnetMask)}`);
      }
      /**
       * The last address in the range given by this address' subnet
       * Often referred to as the Broadcast
       * @returns {Address6}
       */
      endAddress() {
        return _Address6.fromBigInt(this._endAddress());
      }
      /**
       * The last host address in the range given by this address's subnet ie
       * the last address prior to the Broadcast Address
       * @returns {Address6}
       */
      endAddressExclusive() {
        const adjust = BigInt("1");
        return _Address6.fromBigInt(this._endAddress() - adjust);
      }
      /**
       * The hex form of the subnet mask, e.g. `ffff:ffff:ffff:ffff::` for a
       * `/64`. Returns an `Address6`; call `.correctForm()` for the string.
       * @returns {Address6}
       */
      subnetMaskAddress() {
        return _Address6.fromBigInt(BigInt(`0b${"1".repeat(this.subnetMask)}${"0".repeat(constants6.BITS - this.subnetMask)}`));
      }
      /**
       * The Cisco-style wildcard mask, e.g. `::ffff:ffff:ffff:ffff` for a
       * `/64`. This is the bitwise inverse of `subnetMaskAddress()`. Returns
       * an `Address6`; call `.correctForm()` for the string.
       * @returns {Address6}
       */
      wildcardMask() {
        return _Address6.fromBigInt(BigInt(`0b${"0".repeat(this.subnetMask)}${"1".repeat(constants6.BITS - this.subnetMask)}`));
      }
      /**
       * The network address in CIDR string form, e.g. `2001:db8::/32` for
       * `2001:db8::1/32`. For an address with no explicit subnet the prefix
       * is `/128`, e.g. `networkForm()` on `2001:db8::1` returns
       * `2001:db8::1/128`.
       * @returns {string}
       */
      networkForm() {
        return `${this.startAddress().correctForm()}/${this.subnetMask}`;
      }
      /**
       * Return the scope of the address. The 4-bit scope field
       * ([RFC 4291 §2.7](https://datatracker.ietf.org/doc/html/rfc4291#section-2.7))
       * is only defined for multicast addresses; for unicast addresses the scope
       * is derived from the address type per
       * [RFC 4007 §6](https://datatracker.ietf.org/doc/html/rfc4007#section-6).
       * @returns {String}
       */
      getScope() {
        const type = this.getType();
        if (type === "Multicast" || type.startsWith("Multicast ")) {
          const scope = constants6.SCOPES[parseInt(this.getBits(12, 16).toString(10), 10)];
          return scope || "Unknown";
        }
        if (type === "Link-local unicast" || type === "Loopback") {
          return "Link local";
        }
        if (type === "Unspecified") {
          return "Unknown";
        }
        return "Global";
      }
      /**
       * Return the type of the address
       * @returns {String}
       */
      getType() {
        for (let i = 0; i < TYPE_SUBNETS.length; i++) {
          const entry = TYPE_SUBNETS[i];
          if (this.isHostInSubnet(entry[0])) {
            return entry[1];
          }
        }
        return "Global unicast";
      }
      /**
       * Return the bits in the given range as a BigInt
       * @returns {bigint}
       */
      getBits(start, end) {
        return BigInt(`0b${this.getBitsBase2(start, end)}`);
      }
      /**
       * Return the bits in the given range as a base-2 string
       * @returns {String}
       */
      getBitsBase2(start, end) {
        return this.binaryZeroPad().slice(start, end);
      }
      /**
       * Return the bits in the given range as a base-16 string
       * @returns {String}
       */
      getBitsBase16(start, end) {
        const length = end - start;
        if (length % 4 !== 0) {
          throw new Error("Length of bits to retrieve must be divisible by four");
        }
        return this.getBits(start, end).toString(16).padStart(length / 4, "0");
      }
      /**
       * Return the bits that are set past the subnet mask length
       * @returns {String}
       */
      getBitsPastSubnet() {
        return this.getBitsBase2(this.subnetMask, constants6.BITS);
      }
      /**
       * Return the reversed ip6.arpa form of the address
       * @param {Object} options
       * @param {boolean} options.omitSuffix - omit the "ip6.arpa" suffix
       * @returns {String}
       */
      reverseForm(options) {
        if (!options) {
          options = {};
        }
        const characters = Math.floor(this.subnetMask / 4);
        const reversed = this.canonicalForm().replace(/:/g, "").split("").slice(0, characters).reverse().join(".");
        if (characters > 0) {
          if (options.omitSuffix) {
            return reversed;
          }
          return `${reversed}.ip6.arpa.`;
        }
        if (options.omitSuffix) {
          return "";
        }
        return "ip6.arpa.";
      }
      /**
       * Returns the address in correct form, per
       * [RFC 5952](https://datatracker.ietf.org/doc/html/rfc5952): leading zeros
       * stripped, the longest run of zero groups collapsed to `::`, and hex digits
       * lowercased (e.g. `2001:db8::1`). This is the recommended form for display.
       */
      correctForm() {
        let i;
        let groups = [];
        let zeroCounter = 0;
        const zeroes = [];
        for (i = 0; i < this.parsedAddress.length; i++) {
          const value = parseInt(this.parsedAddress[i], 16);
          if (value === 0) {
            zeroCounter++;
          }
          if (value !== 0 && zeroCounter > 0) {
            if (zeroCounter > 1) {
              zeroes.push([i - zeroCounter, i - 1]);
            }
            zeroCounter = 0;
          }
        }
        if (zeroCounter > 1) {
          zeroes.push([this.parsedAddress.length - zeroCounter, this.parsedAddress.length - 1]);
        }
        const zeroLengths = zeroes.map((n) => n[1] - n[0] + 1);
        if (zeroes.length > 0) {
          const index = zeroLengths.indexOf(Math.max(...zeroLengths));
          groups = compact(this.parsedAddress, zeroes[index]);
        } else {
          groups = this.parsedAddress;
        }
        for (i = 0; i < groups.length; i++) {
          if (groups[i] !== "compact") {
            groups[i] = parseInt(groups[i], 16).toString(16);
          }
        }
        let correct = groups.join(":");
        correct = correct.replace(/^compact$/, "::");
        correct = correct.replace(/(^compact)|(compact$)/, ":");
        correct = correct.replace(/compact/, "");
        return correct;
      }
      /**
       * Return a zero-padded base-2 string representation of the address
       * @returns {String}
       * @example
       * var address = new Address6('2001:4860:4001:803::1011');
       * address.binaryZeroPad();
       * // '0010000000000001010010000110000001000000000000010000100000000011
       * //  0000000000000000000000000000000000000000000000000001000000010001'
       */
      binaryZeroPad() {
        if (this._binaryZeroPad === void 0) {
          this._binaryZeroPad = this.bigInt().toString(2).padStart(constants6.BITS, "0");
        }
        return this._binaryZeroPad;
      }
      /**
       * Parses a v4-in-v6 string (e.g. `::ffff:192.168.0.1`) by extracting the
       * trailing IPv4 address into `this.address4` / `this.parsedAddress4` and
       * returning the address with the v4 portion converted to two v6 groups.
       * Used internally by `parse()`.
       */
      // TODO: Improve the semantics of this helper function
      parse4in6(address) {
        if (address.indexOf(".") === -1) {
          return address;
        }
        const groups = address.split(":");
        const lastGroup = groups.slice(-1)[0];
        const v4Octets = lastGroup.split(".");
        if (v4Octets.length === constants4.GROUPS && v4Octets.every((octet) => /^\d{1,3}$/.test(octet))) {
          if (v4Octets.some((octet) => /^0\d/.test(octet))) {
            const highlighted = v4Octets.map(spanLeadingZeroes4).join(".");
            const prefix = groups.slice(0, -1).map(helpers.escapeHtml).join(":");
            const separator = groups.length > 1 ? ":" : "";
            throw new address_error_1.AddressError("IPv4 addresses can't have leading zeroes.", `${prefix}${separator}${highlighted}`);
          }
        }
        const address4 = lastGroup.match(constants4.RE_ADDRESS);
        if (address4) {
          this.parsedAddress4 = address4[0];
          const v4Suffix = this.subnetMask >= 96 ? `/${this.subnetMask - 96}` : "";
          this.address4 = new ipv4_1.Address4(`${this.parsedAddress4}${v4Suffix}`);
          this.v4 = true;
          groups[groups.length - 1] = this.address4.toGroup6();
          address = groups.join(":");
        }
        return address;
      }
      /**
       * Parses an IPv6 address string into its 8 hexadecimal groups (expanding
       * any `::` elision and any trailing v4-in-v6 portion) and stores the result
       * on `this.parsedAddress`. Called automatically by the constructor; you
       * typically don't need to call it directly. Throws `AddressError` if the
       * input is malformed.
       */
      // TODO: Make private?
      parse(address) {
        address = this.parse4in6(address);
        const badCharacters = address.match(constants6.RE_BAD_CHARACTERS);
        if (badCharacters) {
          throw new address_error_1.AddressError(`Bad character${badCharacters.length > 1 ? "s" : ""} detected in address: ${badCharacters.join("")}`, address.replace(constants6.RE_BAD_CHARACTERS, '<span class="parse-error">$1</span>'));
        }
        const badAddress = address.match(constants6.RE_BAD_ADDRESS);
        if (badAddress) {
          throw new address_error_1.AddressError(`Address failed regex: ${badAddress.join("")}`, address.replace(constants6.RE_BAD_ADDRESS, '<span class="parse-error">$1</span>'));
        }
        let groups = [];
        const halves = address.split("::");
        if (halves.length === 2) {
          let first = halves[0].split(":");
          let last = halves[1].split(":");
          if (first.length === 1 && first[0] === "") {
            first = [];
          }
          if (last.length === 1 && last[0] === "") {
            last = [];
          }
          const remaining = this.groups - (first.length + last.length);
          if (!remaining) {
            throw new address_error_1.AddressError("Error parsing groups");
          }
          this.elidedGroups = remaining;
          this.elisionBegin = first.length;
          this.elisionEnd = first.length + this.elidedGroups;
          groups = groups.concat(first);
          for (let i = 0; i < remaining; i++) {
            groups.push("0");
          }
          groups = groups.concat(last);
        } else if (halves.length === 1) {
          groups = address.split(":");
          this.elidedGroups = 0;
        } else {
          throw new address_error_1.AddressError("Too many :: groups found");
        }
        groups = groups.map((group) => parseInt(group, 16).toString(16));
        if (groups.length !== this.groups) {
          throw new address_error_1.AddressError("Incorrect number of groups found");
        }
        return groups;
      }
      /**
       * Returns the canonical (fully expanded) form of the address: all 8 groups,
       * each padded to 4 hex digits, with no `::` collapsing
       * (e.g. `2001:0db8:0000:0000:0000:0000:0000:0001`). Useful for sorting and
       * byte-exact comparison.
       */
      canonicalForm() {
        return this.parsedAddress.map(paddedHex).join(":");
      }
      /**
       * Return the decimal form of the address
       * @returns {String}
       */
      decimal() {
        return this.parsedAddress.map((n) => parseInt(n, 16).toString(10).padStart(5, "0")).join(":");
      }
      /**
       * Return the address as a BigInt
       * @returns {bigint}
       */
      bigInt() {
        return BigInt(`0x${this.parsedAddress.map(paddedHex).join("")}`);
      }
      /**
       * Return the last two groups of this address as an IPv4 address string.
       * If this address carries a CIDR prefix that covers the trailing 32 bits
       * (i.e. `subnetMask >= 96`), the resulting `Address4` inherits the
       * corresponding v4 prefix (`subnetMask - 96`); otherwise it defaults to
       * `/32`.
       * @returns {Address4}
       * @example
       * var address = new Address6('2001:4860:4001::1825:bf11');
       * address.to4().correctForm(); // '24.37.191.17'
       */
      to4() {
        const binary = this.binaryZeroPad().split("");
        const hex = BigInt(`0b${binary.slice(96, 128).join("")}`).toString(16).padStart(8, "0");
        if (this.subnetMask >= 96) {
          const v4Mask = this.subnetMask - 96;
          const groups = [];
          for (let i = 0; i < 8; i += 2) {
            groups.push(parseInt(hex.slice(i, i + 2), 16));
          }
          return new ipv4_1.Address4(`${groups.join(".")}/${v4Mask}`);
        }
        return ipv4_1.Address4.fromHex(hex);
      }
      /**
       * Return the v4-in-v6 form of the address
       * @returns {String}
       */
      to4in6() {
        const address4 = this.to4();
        const address6 = new _Address6(this.parsedAddress.slice(0, 6).join(":"), 6);
        const correct = address6.correctForm();
        let infix = "";
        if (!/:$/.test(correct)) {
          infix = ":";
        }
        return correct + infix + address4.correctForm();
      }
      /**
       * Decodes the Teredo tunneling fields embedded in this address. Returns the
       * Teredo prefix, server IPv4, client IPv4, raw flag bits, cone-NAT flag,
       * UDP port, and Microsoft-format flag breakdown (reserved, universal/local,
       * group/individual, nonce). Only meaningful for addresses in `2001::/32`.
       */
      inspectTeredo() {
        const prefix = this.getBitsBase16(0, 32);
        const bitsForUdpPort = this.getBits(80, 96);
        const udpPort = (bitsForUdpPort ^ BigInt("0xffff")).toString();
        const server4 = ipv4_1.Address4.fromHex(this.getBitsBase16(32, 64));
        const bitsForClient4 = this.getBits(96, 128);
        const client4 = ipv4_1.Address4.fromHex((bitsForClient4 ^ BigInt("0xffffffff")).toString(16).padStart(8, "0"));
        const flagsBase2 = this.getBitsBase2(64, 80);
        const coneNat = (0, common_1.testBit)(flagsBase2, 15);
        const reserved = (0, common_1.testBit)(flagsBase2, 14);
        const groupIndividual = (0, common_1.testBit)(flagsBase2, 8);
        const universalLocal = (0, common_1.testBit)(flagsBase2, 9);
        const nonce = BigInt(`0b${flagsBase2.slice(2, 6) + flagsBase2.slice(8, 16)}`).toString(10);
        return {
          prefix: `${prefix.slice(0, 4)}:${prefix.slice(4, 8)}`,
          server4: server4.address,
          client4: client4.address,
          flags: flagsBase2,
          coneNat,
          microsoft: {
            reserved,
            universalLocal,
            groupIndividual,
            nonce
          },
          udpPort
        };
      }
      /**
       * Decodes the 6to4 tunneling fields embedded in this address. Returns the
       * 6to4 prefix and the embedded IPv4 gateway address. Only meaningful for
       * addresses in `2002::/16`.
       */
      inspect6to4() {
        const prefix = this.getBitsBase16(0, 16);
        const gateway = ipv4_1.Address4.fromHex(this.getBitsBase16(16, 48));
        return {
          prefix: prefix.slice(0, 4),
          gateway: gateway.address
        };
      }
      /**
       * Return a v6 6to4 address from a v6 v4inv6 address
       * @returns {Address6}
       */
      to6to4() {
        if (!this.is4()) {
          return null;
        }
        const addr6to4 = [
          "2002",
          this.getBitsBase16(96, 112),
          this.getBitsBase16(112, 128),
          "",
          "/16"
        ].join(":");
        return new _Address6(addr6to4);
      }
      /**
       * Embed an IPv4 address into a NAT64 IPv6 address using the encoding
       * defined by [RFC 6052](https://datatracker.ietf.org/doc/html/rfc6052).
       * The default prefix is the well-known prefix `64:ff9b::/96`. The prefix
       * length must be one of 32, 40, 48, 56, 64, or 96; for prefixes shorter
       * than /64 the IPv4 octets are split around the reserved bits 64–71.
       * @example
       * Address6.fromAddress4Nat64('192.0.2.33').correctForm(); // '64:ff9b::c000:221'
       * Address6.fromAddress4Nat64('192.0.2.33', '2001:db8::/32').correctForm(); // '2001:db8:c000:221::'
       */
      static fromAddress4Nat64(address, prefix = "64:ff9b::/96") {
        const v4 = new ipv4_1.Address4(address);
        const prefix6 = new _Address6(prefix);
        const pl = prefix6.subnetMask;
        if (pl !== 32 && pl !== 40 && pl !== 48 && pl !== 56 && pl !== 64 && pl !== 96) {
          throw new address_error_1.AddressError("NAT64 prefix length must be 32, 40, 48, 56, 64, or 96");
        }
        const prefixBits = prefix6.binaryZeroPad();
        const v4Bits = v4.binaryZeroPad();
        let bits;
        if (pl === 96) {
          bits = prefixBits.slice(0, 96) + v4Bits;
        } else {
          const beforeU = 64 - pl;
          bits = [
            prefixBits.slice(0, pl),
            v4Bits.slice(0, beforeU),
            // Bits 64 to 71 are the reserved u octet and are always zero.
            "00000000",
            v4Bits.slice(beforeU),
            "0".repeat(128 - 72 - (32 - beforeU))
          ].join("");
        }
        const hex = BigInt(`0b${bits}`).toString(16).padStart(32, "0");
        const groups = [];
        for (let i = 0; i < 8; i++) {
          groups.push(hex.slice(i * 4, (i + 1) * 4));
        }
        return new _Address6(groups.join(":"));
      }
      /**
       * Extract the embedded IPv4 address from a NAT64 IPv6 address using the
       * encoding defined by [RFC 6052](https://datatracker.ietf.org/doc/html/rfc6052).
       * The default prefix is the well-known prefix `64:ff9b::/96`. Returns
       * `null` if this address is not contained within the given prefix.
       * @example
       * new Address6('64:ff9b::c000:221').toAddress4Nat64()!.correctForm(); // '192.0.2.33'
       */
      toAddress4Nat64(prefix = "64:ff9b::/96") {
        const prefix6 = new _Address6(prefix);
        const pl = prefix6.subnetMask;
        if (pl !== 32 && pl !== 40 && pl !== 48 && pl !== 56 && pl !== 64 && pl !== 96) {
          throw new address_error_1.AddressError("NAT64 prefix length must be 32, 40, 48, 56, 64, or 96");
        }
        if (!this.isHostInSubnet(prefix6)) {
          return null;
        }
        const bits = this.binaryZeroPad();
        let v4Bits;
        if (pl === 96) {
          v4Bits = bits.slice(96, 128);
        } else {
          const beforeU = 64 - pl;
          v4Bits = bits.slice(pl, pl + beforeU) + bits.slice(72, 72 + (32 - beforeU));
        }
        const octets = [];
        for (let i = 0; i < 4; i++) {
          octets.push(parseInt(v4Bits.slice(i * 8, (i + 1) * 8), 2).toString());
        }
        return new ipv4_1.Address4(octets.join("."));
      }
      /**
       * Return a byte array.
       *
       * To get a Node.js `Buffer`, wrap the result: `Buffer.from(address.toByteArray())`.
       * @returns {Array}
       */
      toByteArray() {
        const value = this.bigInt().toString(16).padStart(constants6.BITS / 4, "0");
        const bytes = [];
        for (let i = 0, length = value.length; i < length; i += 2) {
          bytes.push(parseInt(value.substring(i, i + 2), 16));
        }
        return bytes;
      }
      /**
       * Return an unsigned byte array.
       *
       * To get a Node.js `Buffer`, wrap the result: `Buffer.from(address.toUnsignedByteArray())`.
       * @returns {Array}
       */
      toUnsignedByteArray() {
        return this.toByteArray().map(unsignByte);
      }
      /**
       * Convert a byte array to an Address6 object.
       *
       * Accepts unsigned bytes (0 to 255) or signed bytes (-128 to 127, as an
       * `Int8Array` or a Java `byte[]` holds them), folding signed values to their
       * unsigned equivalent. Throws `AddressError` unless given exactly 16
       * integers from -128 to 255.
       *
       * To convert from a Node.js `Buffer`, spread it: `Address6.fromByteArray([...buf])`.
       * @returns {Address6}
       */
      static fromByteArray(bytes) {
        common.assertByteArray(bytes, 16, "IPv6", -128);
        return this.fromUnsignedByteArray(bytes.map(unsignByte));
      }
      /**
       * Convert an unsigned byte array to an Address6 object.
       *
       * Throws `AddressError` unless given exactly 16 integers from 0 to 255.
       *
       * To convert from a Node.js `Buffer`, spread it: `Address6.fromUnsignedByteArray([...buf])`.
       * @returns {Address6}
       */
      static fromUnsignedByteArray(bytes) {
        common.assertByteArray(bytes, 16, "IPv6", 0);
        const BYTE_MAX = BigInt("256");
        let result = BigInt("0");
        let multiplier = BigInt("1");
        for (let i = bytes.length - 1; i >= 0; i--) {
          result += multiplier * BigInt(bytes[i].toString(10));
          multiplier *= BYTE_MAX;
        }
        return _Address6.fromBigInt(result);
      }
      /**
       * Returns true if the address is in the canonical form, false otherwise
       * @returns {boolean}
       */
      isCanonical() {
        return this.addressMinusSuffix === this.canonicalForm();
      }
      /**
       * Returns true if the address is a link local address, false otherwise
       * @returns {boolean}
       */
      isLinkLocal() {
        const embedded = this.embeddedIPv4();
        if (embedded) {
          return embedded.isLinkLocal();
        }
        if (this.getBitsBase2(0, 64) === "1111111010000000000000000000000000000000000000000000000000000000") {
          return true;
        }
        return false;
      }
      /**
       * Returns true if the address is a multicast address, false otherwise
       * @returns {boolean}
       */
      isMulticast() {
        const embedded = this.embeddedIPv4();
        if (embedded) {
          return embedded.isMulticast();
        }
        const type = this.getType();
        return type === "Multicast" || type.startsWith("Multicast ");
      }
      /**
       * Returns true if the address was written in v4-in-v6 dotted-quad notation
       * (e.g. `::ffff:127.0.0.1`), false otherwise. This is a notation-level flag
       * and does not reflect whether the address bits lie in the IPv4-mapped
       * (`::ffff:0:0/96`) subnet — for that, see {@link isMapped4}.
       * @returns {boolean}
       */
      is4() {
        return this.v4;
      }
      /**
       * Returns true if the address is an IPv4-mapped IPv6 address in
       * `::ffff:0:0/96` ([RFC 4291 §2.5.5.2](https://datatracker.ietf.org/doc/html/rfc4291#section-2.5.5.2)),
       * false otherwise. Unlike {@link is4}, this checks the underlying address
       * bits rather than the textual notation, so `::ffff:127.0.0.1` and
       * `::ffff:7f00:1` both return true.
       * @returns {boolean}
       */
      isMapped4() {
        return this.isHostInSubnet(IPV4_MAPPED_SUBNET);
      }
      /**
       * If this address embeds a routable IPv4 address — i.e. it is IPv4-mapped
       * (`::ffff:0:0/96`) or sits in the NAT64 well-known prefix (`64:ff9b::/96`,
       * [RFC 6052](https://datatracker.ietf.org/doc/html/rfc6052)) — return that
       * embedded address as an {@link Address4}; otherwise return null.
       *
       * The special-property checks (`isLoopback`, `isLinkLocal`, `isMulticast`,
       * `isUnspecified`, `isPrivate`, `isCGNAT`, `isBroadcast`) call this first and
       * delegate to the embedded {@link Address4} when present, so a literal such as
       * `::ffff:127.0.0.1` is classified by what it actually reaches (loopback)
       * rather than by its IPv6 wrapper (which `getType()` reports as IPv4-mapped).
       * This matters wherever the checks back a trust-boundary decision (e.g. an
       * SSRF allow/deny filter): without normalization, `::ffff:10.0.0.1`,
       * `::ffff:169.254.169.254`, `64:ff9b::7f00:1`, etc. would all read as
       * non-internal.
       * @returns {Address4 | null}
       */
      embeddedIPv4() {
        if (this.isMapped4() || this.isHostInSubnet(NAT64_WELL_KNOWN_SUBNET)) {
          return this.to4();
        }
        return null;
      }
      /**
       * Returns true if the address is a Teredo address, false otherwise
       * @returns {boolean}
       */
      isTeredo() {
        return this.isHostInSubnet(TEREDO_SUBNET);
      }
      /**
       * Returns true if the address is a 6to4 address, false otherwise
       * @returns {boolean}
       */
      is6to4() {
        return this.isHostInSubnet(SIX_TO_FOUR_SUBNET);
      }
      /**
       * Returns true if the address is a loopback address, false otherwise
       * @returns {boolean}
       */
      isLoopback() {
        const embedded = this.embeddedIPv4();
        if (embedded) {
          return embedded.isLoopback();
        }
        return this.getType() === "Loopback";
      }
      /**
       * Returns true if the address is a Unique Local Address in `fc00::/7` ([RFC 4193](https://datatracker.ietf.org/doc/html/rfc4193)). ULAs are the IPv6 equivalent of IPv4 [RFC 1918](https://datatracker.ietf.org/doc/html/rfc1918) private addresses.
       * @returns {boolean}
       */
      isULA() {
        return this.isHostInSubnet(ULA_SUBNET);
      }
      /**
       * Returns true if the address is private, i.e. a Unique Local Address in
       * `fc00::/7` ([RFC 4193](https://datatracker.ietf.org/doc/html/rfc4193)) or an
       * IPv4-mapped / NAT64 address whose embedded IPv4 address is in one of the
       * [RFC 1918](https://datatracker.ietf.org/doc/html/rfc1918) private ranges
       * (e.g. `::ffff:10.0.0.1`). This is the IPv6 counterpart to
       * {@link Address4.isPrivate}; use it instead of {@link isULA} when you need to
       * catch mapped RFC 1918 addresses as well as native ULAs.
       * @returns {boolean}
       */
      isPrivate() {
        const embedded = this.embeddedIPv4();
        if (embedded) {
          return embedded.isPrivate();
        }
        return this.isULA();
      }
      /**
       * Returns true if the address is an IPv4-mapped / NAT64 address whose embedded
       * IPv4 address is in the carrier-grade NAT range `100.64.0.0/10`
       * ([RFC 6598](https://datatracker.ietf.org/doc/html/rfc6598)), false
       * otherwise. There is no native IPv6 CGNAT range, so this only ever returns
       * true for an embedded IPv4 address (e.g. `::ffff:100.64.0.1`).
       * @returns {boolean}
       */
      isCGNAT() {
        const embedded = this.embeddedIPv4();
        if (embedded) {
          return embedded.isCGNAT();
        }
        return false;
      }
      /**
       * Returns true if the address is an IPv4-mapped / NAT64 address whose embedded
       * IPv4 address is the limited broadcast address `255.255.255.255`
       * ([RFC 919](https://datatracker.ietf.org/doc/html/rfc919)), false otherwise.
       * There is no IPv6 broadcast, so this only ever returns true for an embedded
       * IPv4 address (e.g. `::ffff:255.255.255.255`).
       * @returns {boolean}
       */
      isBroadcast() {
        const embedded = this.embeddedIPv4();
        if (embedded) {
          return embedded.isBroadcast();
        }
        return false;
      }
      /**
       * Returns true if the address is the unspecified address `::`.
       * @returns {boolean}
       */
      isUnspecified() {
        const embedded = this.embeddedIPv4();
        if (embedded) {
          return embedded.isUnspecified();
        }
        return this.getType() === "Unspecified";
      }
      /**
       * Returns true if the address is in the documentation prefix `2001:db8::/32` ([RFC 3849](https://datatracker.ietf.org/doc/html/rfc3849)).
       * @returns {boolean}
       */
      isDocumentation() {
        return this.isHostInSubnet(DOCUMENTATION_SUBNET);
      }
      // #endregion
      // #region HTML
      /**
       * Returns the address as an HTTP URL with the host bracketed, e.g.
       * `http://[2001:db8::1]/`. If `optionalPort` is provided it is appended,
       * e.g. `http://[2001:db8::1]:8080/`.
       */
      href(optionalPort) {
        if (optionalPort === void 0) {
          optionalPort = "";
        } else {
          optionalPort = `:${optionalPort}`;
        }
        return `http://[${this.correctForm()}]${optionalPort}/`;
      }
      /**
       * Returns an HTML `<a>` element whose `href` encodes the address in a URL
       * hash fragment (default prefix `/#address=`). Useful for linking between
       * pages of an address-inspector UI.
       * @param options.className - CSS class for the rendered `<a>` element
       * @param options.prefix - hash prefix prepended to the address (default `/#address=`)
       * @param options.v4 - when true, render the address in v4-in-v6 form
       */
      link(options) {
        if (!options) {
          options = {};
        }
        if (options.className === void 0) {
          options.className = "";
        }
        if (options.prefix === void 0) {
          options.prefix = "/#address=";
        }
        if (options.v4 === void 0) {
          options.v4 = false;
        }
        let formFunction = this.correctForm;
        if (options.v4) {
          formFunction = this.to4in6;
        }
        const form = formFunction.call(this);
        const safeHref = helpers.escapeHtml(`${options.prefix}${form}`);
        const safeForm = helpers.escapeHtml(form);
        if (options.className) {
          const safeClass = helpers.escapeHtml(options.className);
          return `<a href="${safeHref}" class="${safeClass}">${safeForm}</a>`;
        }
        return `<a href="${safeHref}">${safeForm}</a>`;
      }
      /**
       * Groups an address.
       *
       * Returns an HTML fragment: each group is wrapped in a `<span>` carrying
       * the group classes an address-inspector UI hovers on. The address content
       * is HTML-escaped; anything you concatenate around it is your
       * responsibility.
       * @returns {String}
       */
      group() {
        if (this.elidedGroups === 0) {
          return helpers.simpleGroup(this.addressMinusSuffix).join(":");
        }
        assert(typeof this.elidedGroups === "number");
        assert(typeof this.elisionBegin === "number");
        const output = [];
        const [left, right] = this.addressMinusSuffix.split("::");
        if (left.length) {
          output.push(...helpers.simpleGroup(left));
        } else {
          output.push("");
        }
        const classes = ["hover-group"];
        for (let i = this.elisionBegin; i < this.elisionBegin + this.elidedGroups; i++) {
          classes.push(`group-${i}`);
        }
        output.push(`<span class="${classes.join(" ")}"></span>`);
        if (right.length) {
          output.push(...helpers.simpleGroup(right, this.elisionEnd));
        } else {
          output.push("");
        }
        if (this.is4()) {
          assert(this.address4 instanceof ipv4_1.Address4);
          output.pop();
          output.push(this.address4.groupForV6());
        }
        return output.join(":");
      }
      // #endregion
      // #region Regular expressions
      /**
       * Generate a regular expression string that can be used to find or validate
       * all variations of this address
       * @param {boolean} substringSearch
       * @returns {string}
       */
      regularExpressionString(substringSearch = false) {
        let output = [];
        const address6 = new _Address6(this.correctForm());
        if (address6.elidedGroups === 0) {
          output.push((0, regular_expressions_1.simpleRegularExpression)(address6.parsedAddress));
        } else if (address6.elidedGroups === constants6.GROUPS) {
          output.push((0, regular_expressions_1.possibleElisions)(constants6.GROUPS));
        } else {
          const halves = address6.address.split("::");
          if (halves[0].length) {
            output.push((0, regular_expressions_1.simpleRegularExpression)(halves[0].split(":")));
          }
          assert(typeof address6.elidedGroups === "number");
          output.push((0, regular_expressions_1.possibleElisions)(address6.elidedGroups, halves[0].length !== 0, halves[1].length !== 0));
          if (halves[1].length) {
            output.push((0, regular_expressions_1.simpleRegularExpression)(halves[1].split(":")));
          }
          output = [output.join(":")];
        }
        if (!substringSearch) {
          output = [
            "(?=^|",
            regular_expressions_1.ADDRESS_BOUNDARY,
            "|[^\\w\\:])(",
            ...output,
            ")(?=[^\\w\\:]|",
            regular_expressions_1.ADDRESS_BOUNDARY,
            "|$)"
          ];
        }
        return output.join("");
      }
      /**
       * Generate a regular expression that can be used to find or validate all
       * variations of this address.
       * @param {boolean} substringSearch
       * @returns {RegExp}
       */
      regularExpression(substringSearch = false) {
        return new RegExp(this.regularExpressionString(substringSearch), "i");
      }
    };
    exports.Address6 = Address62;
    var TYPE_SUBNETS = Object.keys(constants6.TYPES).map((subnet) => [
      new Address62(subnet),
      constants6.TYPES[subnet]
    ]);
    var TEREDO_SUBNET = new Address62("2001::/32");
    var SIX_TO_FOUR_SUBNET = new Address62("2002::/16");
    var ULA_SUBNET = new Address62("fc00::/7");
    var DOCUMENTATION_SUBNET = new Address62("2001:db8::/32");
    var IPV4_MAPPED_SUBNET = new Address62("::ffff:0:0/96");
    var NAT64_WELL_KNOWN_SUBNET = new Address62("64:ff9b::/96");
  }
});

// node_modules/ip-address/dist/ip-address.js
var require_ip_address = __commonJS({
  "node_modules/ip-address/dist/ip-address.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.v6 = exports.AddressError = exports.Address6 = exports.Address4 = void 0;
    var ipv4_1 = require_ipv4();
    Object.defineProperty(exports, "Address4", { enumerable: true, get: function() {
      return ipv4_1.Address4;
    } });
    var ipv6_1 = require_ipv6();
    Object.defineProperty(exports, "Address6", { enumerable: true, get: function() {
      return ipv6_1.Address6;
    } });
    var address_error_1 = require_address_error();
    Object.defineProperty(exports, "AddressError", { enumerable: true, get: function() {
      return address_error_1.AddressError;
    } });
    var helpers = __importStar(require_helpers());
    exports.v6 = { helpers };
  }
});

// src/ai/flows/extract-question-metadata.ts
import { z } from "zod";
var ExtractQuestionMetadataInputSchema, MarksPartSchema, MarksQuestionSchema, QuestionMetadataSchema, extractQuestionMetadataFlow, GenerateAnswerInputSchema, GenerateAnswerOutputSchema, generateAnswerFlow;
var init_extract_question_metadata = __esm({
  "src/ai/flows/extract-question-metadata.ts"() {
    "use strict";
    init_genkit();
    ExtractQuestionMetadataInputSchema = z.object({
      ocrText: z.string().describe("Raw text extracted from OCR of a question paper/document"),
      filename: z.string().optional().describe("Original filename for context"),
      uploaderId: z.string().describe("ID of the user who uploaded the document")
    });
    MarksPartSchema = z.object({
      label: z.string().describe("Part label like (a), (b), (c) or 1, 2, 3"),
      marks: z.number().describe("Marks allocated to this part"),
      text: z.string().optional().describe("Brief text of this sub-question")
    });
    MarksQuestionSchema = z.object({
      question: z.string().describe('Question number like "1", "2", "3a"'),
      totalMarks: z.number().describe("Total marks for this question"),
      parts: z.array(MarksPartSchema).optional().describe("Sub-parts with individual marks if present")
    });
    QuestionMetadataSchema = z.object({
      title: z.string().describe("Short descriptive title for the question"),
      institution: z.string().describe("University or institution name"),
      course: z.string().describe("Course code and name"),
      faculty: z.string().optional().describe("Faculty/School"),
      department: z.string().optional().describe("Department"),
      year: z.string().describe('Academic year range (e.g., "2025/2026")'),
      semester: z.enum(["First", "Second"]).describe("Semester: First or Second"),
      type: z.enum(["Objective", "Theory", "Mixed"]).describe("Question type"),
      contentPreview: z.string().describe("First 200-300 chars of the question content for search results"),
      fullContent: z.string().describe("Complete question text as extracted"),
      answer: z.string().optional().describe("Model answer/solution if present in document"),
      explanation: z.string().optional().describe("Explanation or marking scheme if present"),
      marksScheme: z.array(MarksQuestionSchema).optional().describe("Marks allocation per question/part as printed on the exam paper"),
      answerGenerated: z.string().optional().describe("AI-generated model answer for the questions"),
      confidence: z.object({
        overall: z.number().min(0).max(1),
        institution: z.number().min(0).max(1),
        course: z.number().min(0).max(1),
        year: z.number().min(0).max(1),
        semester: z.number().min(0).max(1),
        type: z.number().min(0).max(1)
      }).describe("Confidence scores for each extracted field (0-1)")
    });
    extractQuestionMetadataFlow = ai.defineFlow(
      {
        name: "extractQuestionMetadata",
        inputSchema: ExtractQuestionMetadataInputSchema,
        outputSchema: QuestionMetadataSchema
      },
      async ({ ocrText, filename, uploaderId: _uploaderId }) => {
        const prompt = `You are an expert at parsing academic question papers from Nigerian universities.

Given the following OCR-extracted text from a question paper/document, extract the structured metadata.

OCR Text:
${ocrText}

${filename ? `Filename: ${filename}` : ""}

Extract the following information as JSON:
1. title: A concise title for this question/set of questions (max 100 chars)
2. institution: The university/institution name
3. course: Course code and name
4. faculty: Faculty/School if mentioned
5. department: Department if mentioned
6. year: The academic year as a range (e.g., "2025/2026")
7. semester: "First" or "Second"
8. type: "Objective" (multiple choice), "Theory" (essay/structured), or "Mixed"
9. contentPreview: First 200-300 chars of actual question content (not metadata)
10. fullContent: The complete question text exactly as it appears
11. answer: The model answer/solution if PROVIDED in the document
12. explanation: Explanation or marking scheme if PROVIDED in the document
13. marksScheme: Extract the marks allocation as printed on the exam paper. For EACH question that shows marks, create an entry with:
    - question: The question number ("1", "2", etc.)
    - totalMarks: Total marks for the question (e.g., 20)
    - parts: Array of sub-parts if the question is divided, each with label ("(a)", "(b)"), marks, and brief text
    Example: If the paper says "Question 1 (20 marks)" with parts (a) 5 marks, (b) 8 marks, (c) 7 marks:
    { "question": "1", "totalMarks": 20, "parts": [{"label":"(a)","marks":5,"text":"Define BST"},{"label":"(b)","marks":8,"text":"Insert algorithm"},{"label":"(c)","marks":7,"text":"Time complexity"}] }
    If no marks are visible, set marksScheme to an empty array [].
14. answerGenerated: Generate a MODEL ANSWER for ALL questions combined. Write a comprehensive answer that a top-scoring student would write. For theory questions, structure your answer to address each sub-part. For objective questions, provide the correct option with explanation.
15. confidence: Confidence scores (0.0-1.0) for each field

Rules:
- Only extract metadata that is clearly present in the text
- For Nigerian universities, recognize common abbreviations: UNILAG, UI, OAU, FUTO, ABU, BUK, etc.
- Course codes follow patterns like CSC/MTH/PHY/CHM/STA + 3 digits
- If information is ambiguous, set lower confidence and make reasonable inference
- marksScheme should capture ALL marks information visible on the paper
- answerGenerated should be thorough and demonstrate subject knowledge

Return ONLY valid JSON matching the schema.`;
        const { output } = await ai.generate({
          prompt,
          output: { schema: QuestionMetadataSchema },
          config: { temperature: 0.2 }
        });
        if (!output) {
          throw new Error("AI failed to extract metadata");
        }
        return output;
      }
    );
    GenerateAnswerInputSchema = z.object({
      fullContent: z.string().describe("The full question text"),
      marksScheme: z.array(MarksQuestionSchema).optional().describe("Marks allocation if available")
    });
    GenerateAnswerOutputSchema = z.object({
      answer: z.string().describe("AI-generated model answer"),
      explanation: z.string().optional().describe("Step-by-step explanation of the answer")
    });
    generateAnswerFlow = ai.defineFlow(
      {
        name: "generateAnswer",
        inputSchema: GenerateAnswerInputSchema,
        outputSchema: GenerateAnswerOutputSchema
      },
      async ({ fullContent, marksScheme }) => {
        const marksContext = marksScheme && marksScheme.length > 0 ? `

Marks allocation:
${JSON.stringify(marksScheme, null, 2)}

Structure your answer to address each sub-part and note how many marks each section is worth.` : "";
        const prompt = `You are an expert academic tutor specializing in Nigerian university courses.

Given the following exam questions, write a comprehensive model answer that a top-scoring student would submit.

Questions:
${fullContent}
${marksContext}

Rules:
- Answer ALL questions thoroughly
- For theory questions: provide detailed explanations with examples where appropriate
- For objective/MCQ questions: state the correct option and explain why
- If marks are allocated, ensure your answer addresses each part and matches the marks weight
- Use clear formatting with question numbers and sub-parts
- Be accurate and academically rigorous
- For the explanation field, provide a step-by-step walkthrough of how to arrive at the answer

Return ONLY valid JSON matching the schema.`;
        const { output } = await ai.generate({
          prompt,
          output: { schema: GenerateAnswerOutputSchema },
          config: { temperature: 0.3 }
        });
        if (!output) {
          throw new Error("AI failed to generate answer");
        }
        return output;
      }
    );
  }
});

// src/ai/flows/process-uploaded-question.ts
var process_uploaded_question_exports = {};
__export(process_uploaded_question_exports, {
  processUploadedQuestionFlow: () => processUploadedQuestionFlow
});
import { z as z2 } from "zod";
import { v4 as uuidv4 } from "uuid";
var ProcessUploadedQuestionInputSchema, ProcessUploadedQuestionOutputSchema, processUploadedQuestionFlow;
var init_process_uploaded_question = __esm({
  "src/ai/flows/process-uploaded-question.ts"() {
    "use strict";
    init_genkit();
    init_extract_question_metadata();
    init_supabase_server();
    ProcessUploadedQuestionInputSchema = z2.object({
      uploadId: z2.string().uuid(),
      ocrText: z2.string(),
      filename: z2.string().optional(),
      uploaderId: z2.string(),
      // User-provided metadata from the upload form (used as primary source)
      institution: z2.string().optional(),
      course: z2.string().optional(),
      courseCode: z2.string().optional(),
      year: z2.string().optional(),
      semester: z2.enum(["First", "Second"]).optional()
    });
    ProcessUploadedQuestionOutputSchema = z2.object({
      success: z2.boolean(),
      questionId: z2.string().optional(),
      uploadId: z2.string(),
      error: z2.string().optional(),
      metadata: z2.any().optional()
    });
    processUploadedQuestionFlow = ai.defineFlow(
      {
        name: "processUploadedQuestion",
        inputSchema: ProcessUploadedQuestionInputSchema,
        outputSchema: ProcessUploadedQuestionOutputSchema
      },
      async ({ uploadId, ocrText, filename, uploaderId, institution: formInstitution, course: formCourse, courseCode: formCourseCode, year: formYear, semester: formSemester }) => {
        const supabase = createServerSupabase();
        try {
          console.log(`Starting AI metadata extraction for upload ${uploadId}`);
          const metadata = await extractQuestionMetadataFlow({
            ocrText,
            filename,
            uploaderId
          });
          console.log(`Metadata extracted for upload ${uploadId}:`, {
            institution: metadata.institution,
            course: metadata.course,
            year: metadata.year,
            type: metadata.type
          });
          const { data: uploadRecord, error: uploadError } = await supabase.from("question_uploads").select("file_url, file_name").eq("id", uploadId).single();
          if (uploadError || !uploadRecord) {
            throw new Error(`Upload record not found: ${uploadError?.message}`);
          }
          const rawYear = formYear || metadata.year || "";
          const yearMatch = String(rawYear).match(/(\d{4})/);
          const yearSession = yearMatch ? rawYear : String((/* @__PURE__ */ new Date()).getFullYear());
          const yearStart = yearMatch ? yearMatch[1] : String((/* @__PURE__ */ new Date()).getFullYear());
          const questionData = {
            id: uuidv4(),
            title: metadata.title,
            institution: formInstitution || metadata.institution,
            course: formCourse || metadata.course,
            faculty: metadata.faculty,
            department: metadata.department,
            year: yearSession,
            semester: formSemester || metadata.semester,
            type: metadata.type || "Mixed",
            status: "pending",
            content_preview: metadata.contentPreview,
            full_content: metadata.fullContent,
            answer: metadata.answer,
            explanation: metadata.explanation,
            file_url: uploadRecord.file_url,
            file_name: uploadRecord.file_name,
            file_type: uploadRecord.file_name.split(".").pop() || "unknown",
            uploader_id: uploaderId,
            ai_extracted_data: metadata,
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          if (formCourseCode) {
            questionData.course_code = formCourseCode;
          }
          ;
          let { data: question, error: questionError } = await supabase.from("questions").insert([questionData]).select().single();
          if (questionError && yearSession !== yearStart) {
            console.log(`Year format '${yearSession}' failed, retrying with '${yearStart}'`);
            questionData.year = yearStart;
            const retry = await supabase.from("questions").insert([questionData]).select().single();
            question = retry.data;
            questionError = retry.error;
          }
          if (questionError) {
            throw new Error(`Failed to create question: ${questionError.message}`);
          }
          await supabase.from("question_uploads").update({
            question_id: question.id,
            upload_status: "processed",
            processed_at: (/* @__PURE__ */ new Date()).toISOString()
          }).eq("id", uploadId);
          console.log(`Question created successfully: ${question.id} from upload ${uploadId}`);
          return {
            success: true,
            questionId: question.id,
            uploadId,
            metadata
          };
        } catch (error) {
          console.error(`Failed to process uploaded question ${uploadId}:`, error);
          await supabase.from("question_uploads").update({
            upload_status: "failed",
            ocr_text: `AI processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            processed_at: (/* @__PURE__ */ new Date()).toISOString()
          }).eq("id", uploadId);
          return {
            success: false,
            uploadId,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }
    );
  }
});

// src/ai/flows/process-question-document.ts
var process_question_document_exports = {};
__export(process_question_document_exports, {
  processQuestionDocument: () => processQuestionDocument
});
import { z as z3 } from "zod";
function parseDataUri(dataUri) {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error("Invalid data URI format");
  }
  return { mimeType: match[1], base64: match[2] };
}
function getGoogleDriveFileId(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}
async function fetchGoogleDriveFileAsDataUri(fileUrl) {
  const fileId = getGoogleDriveFileId(fileUrl);
  if (!fileId) {
    throw new Error("Invalid Google Drive URL. Could not extract file ID.");
  }
  const downloadUrl = `https://drive.google.com/gcs/d/${fileId}`;
  const fetch2 = (await import("node-fetch")).default;
  const response = await fetch2(downloadUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
async function processQuestionDocument(input) {
  return processDocumentFlow(input);
}
var ProcessQuestionDocumentInputSchema, ProcessQuestionDocumentOutputSchema, processDocumentFlow;
var init_process_question_document = __esm({
  "src/ai/flows/process-question-document.ts"() {
    "use strict";
    init_genkit();
    ProcessQuestionDocumentInputSchema = z3.object({
      // A URL or a Data URI
      fileUrl: z3.string().describe("The public Google Drive URL or a Data URI of the question paper.")
    });
    ProcessQuestionDocumentOutputSchema = z3.object({
      institutionName: z3.string().describe("The full name of the institution."),
      courseName: z3.string().describe('The name of the course without the code, e.g. "Data Structures and Algorithms"'),
      courseCode: z3.string().optional().describe('The course code if present, e.g. "CSC 301"'),
      academicSession: z3.string().describe('The academic session in YYYY/YYYY format, e.g. "2023/2024".'),
      semester: z3.enum(["First", "Second"]).describe("The semester for the exam."),
      fullContent: z3.string().describe("The full text content extracted from the document.")
    });
    processDocumentFlow = ai.defineFlow(
      {
        name: "processDocumentFlow",
        inputSchema: ProcessQuestionDocumentInputSchema,
        outputSchema: ProcessQuestionDocumentOutputSchema
      },
      async ({ fileUrl }) => {
        let dataUri = fileUrl;
        if (fileUrl.startsWith("http")) {
          dataUri = await fetchGoogleDriveFileAsDataUri(fileUrl);
        }
        const { base64, mimeType } = parseDataUri(dataUri);
        console.log(`Sending image to Gemini vision (${mimeType}, ${Math.round(base64.length * 0.75 / 1024)}KB)...`);
        const startTime = Date.now();
        const { output } = await ai.generate({
          prompt: [
            {
              text: `Extract structured metadata from this academic question paper image.

Read the image carefully and return:
- institutionName: The full university/institution name (e.g. "University of Lagos")
- courseName: Course name WITHOUT the code (e.g. "Data Structures and Algorithms")
- courseCode: The course code if visible (e.g. "CSC 301")
- academicSession: The academic session in YYYY/YYYY format (e.g. "2023/2024" for "2023/2024 Academic Session")
- semester: "First" or "Second"
- fullContent: ALL text visible in the image, transcribed exactly as it appears

Rules:
- Transcribe text faithfully from the image \u2014 do not guess or fabricate
- For Nigerian universities, recognize abbreviations: UNILAG, UI, OAU, FUTO, ABU, BUK, UNN, OOU, etc.
- If year range like "2023/2024", return it as "2023/2024"
- If only a single year is found (e.g. "2023"), return it as "2023/2024" (assume same academic year)
- If semester not stated, default to "First"
- Return ONLY valid JSON matching the schema`
            },
            {
              media: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ],
          output: {
            schema: ProcessQuestionDocumentOutputSchema
          }
        });
        const elapsed = Date.now() - startTime;
        console.log(`Gemini responded in ${elapsed}ms: institution=${output?.institutionName}, course=${output?.courseName}, code=${output?.courseCode}, session=${output?.academicSession}`);
        if (!output) {
          throw new Error("Failed to extract metadata from document image");
        }
        return output;
      }
    );
  }
});

// api/_server.ts
import express from "express";

// server/routes/questions.ts
init_supabase_server();
import { Router } from "express";

// src/lib/mappers.ts
function mapQuestionRow(row) {
  return {
    id: row.id,
    title: row.title,
    institution: row.institution,
    course: row.course,
    year: String(row.year),
    semester: row.semester,
    type: row.type,
    status: row.status,
    contentPreview: row.content_preview ?? "",
    fullContent: row.full_content ?? "",
    answer: row.answer ?? void 0,
    explanation: row.explanation ?? void 0,
    marksScheme: row.marks_scheme ?? void 0,
    answerGenerated: row.answer_generated ?? void 0,
    fileUrl: row.file_url ?? void 0,
    fileName: row.file_name ?? void 0,
    fileType: row.file_type ?? void 0,
    uploaderId: row.uploader_id ?? void 0,
    lecturerId: row.lecturer_id ?? void 0,
    lecturer: row.lecturer ?? void 0,
    createdAt: row.created_at ?? void 0,
    updatedAt: row.updated_at ?? void 0
  };
}

// server/routes/questions.ts
var questionsRouter = Router();
var LIST_SELECT = "id, title, institution, course, faculty, department, year, semester, type, status, content_preview, file_name, file_type, lecturer_id, created_at, updated_at";
questionsRouter.get("/", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    let query = supabase.from("questions").select(LIST_SELECT).eq("status", "approved").order("created_at", { ascending: false });
    const { institution, course, year, semester, type } = req.query;
    if (typeof institution === "string" && institution) {
      query = query.eq("institution", institution);
    }
    if (typeof course === "string" && course) {
      query = query.ilike("course", `%${course}%`);
    }
    if (typeof year === "string" && year) {
      query = query.eq("year", Number(year));
    }
    if (typeof semester === "string" && semester) {
      query = query.eq("semester", semester);
    }
    if (typeof type === "string" && type) {
      query = query.eq("type", type);
    }
    const { data, error } = await query.limit(50);
    if (error) throw error;
    res.json((data ?? []).map((row) => mapQuestionRow(row)));
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});
questionsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("questions").select("*").eq("id", id).single();
    if (error && error.code !== "PGRST116") {
      if (error.code === "22P02") {
        res.status(404).json({ error: "Question not found" });
        return;
      }
      throw error;
    }
    if (!data) {
      res.status(404).json({ error: "Question not found" });
      return;
    }
    const question = mapQuestionRow(data);
    if (data.lecturer_id) {
      const { data: lecturer } = await supabase.from("lecturers").select("id, name, institution, department, rating_avg, review_count, photo_url").eq("id", data.lecturer_id).single();
      if (lecturer) {
        question.lecturer = lecturer;
      }
    }
    res.json(question);
  } catch (error) {
    console.error(`Failed to fetch question ${id}:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// server/routes/admin.ts
init_supabase_server();
init_middleware();
import { Router as Router2 } from "express";
var adminBaseRouter = Router2();
adminBaseRouter.get("/me", requireAuth, async (_req, res) => {
  try {
    const user = res.locals.user;
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single();
    if (error || !data) {
      res.json({ isAdmin: false });
      return;
    }
    res.json({ isAdmin: data.is_admin === true });
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.json({ isAdmin: false });
  }
});
adminBaseRouter.get("/stats", requireAdmin, async (_req, res) => {
  try {
    const supabase = createServerSupabase();
    const [questionsResult, usersResult] = await Promise.all([
      supabase.from("questions").select("status"),
      supabase.from("user_profiles").select("id", { count: "exact", head: true })
    ]);
    if (questionsResult.error) throw questionsResult.error;
    const questions = questionsResult.data ?? [];
    const total = questions.length;
    const pending = questions.filter((q) => q.status === "pending").length;
    const approved = questions.filter((q) => q.status === "approved").length;
    const rejected = questions.filter((q) => q.status === "rejected").length;
    const totalUsers = usersResult.count ?? 0;
    res.json({ total, pending, approved, rejected, totalUsers });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});
adminBaseRouter.patch("/feedback/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body ?? {};
    const allowed = ["open", "planned", "in-progress", "done"];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: "Invalid status. Must be one of: " + allowed.join(", ") });
      return;
    }
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("feedback_items").update({ status }).eq("id", id).select("id, status").single();
    if (error) throw error;
    res.json({ success: true, item: data });
  } catch (error) {
    console.error("Error updating feedback status:", error);
    res.status(500).json({ error: "Failed to update feedback status" });
  }
});
var adminRouter = Router2();
adminRouter.get("/", requireAdmin, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    if (req.query.institutions === "true") {
      const { data: data2, error: error2 } = await supabase.from("questions").select("institution").order("institution");
      if (error2) throw error2;
      const uniqueInstitutions = [...new Set((data2 ?? []).map((q) => q.institution))];
      res.json(uniqueInstitutions);
      return;
    }
    let query = supabase.from("questions").select("*").order("created_at", { ascending: false });
    const search = typeof req.query.search === "string" ? req.query.search : void 0;
    const status = typeof req.query.status === "string" ? req.query.status : void 0;
    const institution = typeof req.query.institution === "string" ? req.query.institution : void 0;
    if (search) {
      query = query.or(`title.ilike.%${search}%,institution.ilike.%${search}%,course.ilike.%${search}%`);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (institution) {
      query = query.eq("institution", institution);
    }
    const { data, error } = await query.limit(100);
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching admin questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});
adminRouter.post("/bulk/:action", requireAdmin, async (req, res) => {
  const action = String(req.params.action);
  const user = res.locals.user;
  try {
    if (!["approve", "reject"].includes(action)) {
      res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
      return;
    }
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "ids must be a non-empty array" });
      return;
    }
    const supabase = createServerSupabase();
    const newStatus = action === "approve" ? "approved" : "rejected";
    const { data, error } = await supabase.from("questions").update({
      status: newStatus,
      approved_at: (/* @__PURE__ */ new Date()).toISOString(),
      approved_by: user.id,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).in("id", ids).select();
    if (error) throw error;
    res.json({
      success: true,
      count: data?.length ?? 0,
      message: `${data?.length ?? 0} exam paper(s) ${action}d successfully`
    });
  } catch (error) {
    console.error(`Error bulk ${action}ing questions:`, error);
    res.status(500).json({ error: `Failed to bulk ${action} questions` });
  }
});
adminRouter.put("/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const allowedFields = ["title", "institution", "course", "course_code", "year", "semester", "type", "content_preview", "full_content", "answer", "explanation", "marks_scheme", "answer_generated"];
    const updates = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    for (const field of allowedFields) {
      if (req.body[field] !== void 0) {
        updates[field] = req.body[field];
      }
    }
    if (Object.keys(updates).length <= 1) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }
    const { data, error } = await supabase.from("questions").update(updates).eq("id", id).select().single();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "Exam paper not found" });
      return;
    }
    res.json({ success: true, question: data, message: "Exam paper updated successfully" });
  } catch (error) {
    console.error("Error updating exam paper:", error);
    res.status(500).json({ error: "Failed to update exam paper" });
  }
});
adminRouter.get("/:id/reprocess-status", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("questions").select("status, ai_extracted_data").eq("id", id).single();
    if (error || !data) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const step = data.ai_extracted_data?.reprocess_step || (data.status === "pending" ? "idle" : "unknown");
    res.json({ step, status: data.status });
  } catch (error) {
    console.error("Reprocess status error:", error);
    res.status(500).json({ error: "Failed to load re-process status" });
  }
});
adminRouter.post("/:id/reprocess", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const { data: question, error: fetchError } = await supabase.from("questions").select("id, file_url, file_name, uploader_id").eq("id", id).single();
    if (fetchError || !question) {
      res.status(404).json({ error: "Exam paper not found" });
      return;
    }
    if (!question.file_url) {
      res.status(400).json({ error: "No file URL available for re-processing" });
      return;
    }
    const updateStep = async (step) => {
      await supabase.from("questions").update({ ai_extracted_data: { reprocess_step: step } }).eq("id", id);
    };
    const totalStart = Date.now();
    await supabase.from("questions").update({ status: "processing", updated_at: (/* @__PURE__ */ new Date()).toISOString(), ai_extracted_data: { reprocess_step: "starting" } }).eq("id", id);
    const { ai: ai2 } = await Promise.resolve().then(() => (init_genkit(), genkit_exports));
    const { z: z5 } = await import("zod");
    const fileStart = Date.now();
    await updateStep("fetching_file");
    const fetch2 = (await import("node-fetch")).default;
    const response = await fetch2(question.file_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = response.headers.get("content-type") || "application/octet-stream";
    const fileTime = Date.now() - fileStart;
    console.log(`Re-processing question ${id} with single Gemini call (${mimeType}, ${Math.round(base64.length * 0.75 / 1024)}KB)`);
    const CombinedResultSchema = z5.object({
      extractedText: z5.string().describe("Full raw text extracted from the image"),
      title: z5.string().describe("Short descriptive title (max 100 chars)"),
      institution: z5.string().describe("University/institution name"),
      course: z5.string().describe("Course code and name"),
      faculty: z5.string().optional().describe("Faculty/School"),
      department: z5.string().optional().describe("Department"),
      year: z5.string().describe("Academic year range (e.g. 2025/2026)"),
      semester: z5.enum(["First", "Second"]).describe("Semester"),
      type: z5.enum(["Objective", "Theory", "Mixed"]).describe("Question type"),
      contentPreview: z5.string().describe("First 200-300 chars of question content"),
      fullContent: z5.string().describe("Complete question text as extracted"),
      answer: z5.string().optional().describe("Model answer if present in document"),
      explanation: z5.string().optional().describe("Explanation or marking scheme if present"),
      marksScheme: z5.array(z5.object({
        question: z5.string(),
        totalMarks: z5.number(),
        parts: z5.array(z5.object({ label: z5.string(), marks: z5.number(), text: z5.string().optional() })).optional()
      })).optional().describe("Marks allocation from exam paper"),
      answerGenerated: z5.string().optional().describe("AI-generated model answer")
    });
    await updateStep("ai_processing");
    const startTime = Date.now();
    const { output } = await ai2.generate({
      prompt: [
        {
          text: `You are an expert at reading academic exam papers from Nigerian universities.

Extract ALL text from this exam paper image and simultaneously extract structured metadata.

Rules for text extraction:
- Transcribe text faithfully \u2014 do not guess or fabricate
- Preserve formatting and structure (headings, numbered questions, sub-questions)
- Include ALL visible text: institution name, course details, instructions, questions

Rules for metadata extraction:
- institution: The university name
- course: Course code and name (e.g. "CSC 301 - Data Structures")
- year: Academic year range (e.g. "2025/2026"). Convert single years to ranges.
- semester: "First" or "Second"
- type: "Objective" (MCQ), "Theory" (essay), or "Mixed"
- contentPreview: First 200-300 chars of actual question content
- fullContent: Complete question text

Rules for marksScheme:
- Extract ALL marks allocation visible on the paper
- For each question with marks, create entry with question number, totalMarks, and parts array
- Each part has label, marks, and brief text
- If no marks visible, use empty array []

Rules for answerGenerated:
- Write a comprehensive model answer that a top-scoring student would submit
- For theory: detailed explanations with examples
- For MCQ: correct option with explanation
- Structure by question number and sub-parts

Return structured JSON with all fields.`
        },
        {
          media: {
            url: `data:${mimeType};base64,${base64}`
          }
        }
      ],
      output: { schema: CombinedResultSchema },
      config: { temperature: 0.1 }
    });
    const aiTime = Date.now() - startTime;
    console.log(`Single Gemini call completed in ${aiTime}ms`);
    const saveStart = Date.now();
    await updateStep("processing_results");
    await updateStep("processing_results");
    if (!output) {
      throw new Error("Gemini returned no output \u2014 the image may be unreadable");
    }
    const ocrText = output.extractedText;
    if (!ocrText || ocrText.trim().length < 10) {
      throw new Error("Gemini extracted very little text from the image");
    }
    console.log(`Extracted ${ocrText.length} chars, metadata: ${output.title}`);
    const rawYear = output.year || "";
    const yearMatch = String(rawYear).match(/(\d{4})/);
    const yearSession = yearMatch ? rawYear : String((/* @__PURE__ */ new Date()).getFullYear());
    const yearStart = yearMatch ? yearMatch[1] : String((/* @__PURE__ */ new Date()).getFullYear());
    const updates = {
      title: output.title,
      institution: output.institution,
      course: output.course,
      faculty: output.faculty,
      department: output.department,
      year: yearSession,
      semester: output.semester,
      type: output.type || "Mixed",
      content_preview: output.contentPreview,
      full_content: output.fullContent,
      answer: output.answer,
      explanation: output.explanation,
      marks_scheme: output.marksScheme || [],
      answer_generated: output.answerGenerated,
      ai_extracted_data: {
        confidence: { overall: 0.95, institution: 0.92, course: 0.9, year: 0.93, semester: 0.91, type: 0.88 },
        extractedText: ocrText
      },
      status: "pending",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    let { error: updateError } = await supabase.from("questions").update(updates).eq("id", id);
    if (updateError && yearSession !== yearStart) {
      console.log(`Year format '${yearSession}' failed, retrying with '${yearStart}'`);
      updates.year = yearStart;
      const retry = await supabase.from("questions").update(updates).eq("id", id);
      updateError = retry.error;
    }
    if (updateError) {
      throw new Error(`Failed to update question: ${updateError.message}`);
    }
    const saveTime = Date.now() - saveStart;
    const totalTime = Date.now() - totalStart;
    await updateStep("complete");
    const { data: updatedQuestion, error: fetchUpdatedError } = await supabase.from("questions").select("*").eq("id", id).single();
    if (fetchUpdatedError) throw fetchUpdatedError;
    res.json({
      success: true,
      question: updatedQuestion,
      message: "Exam paper re-processed successfully",
      ocrConfidence: { overall: 0.95 },
      timing: { fetchFile: fileTime, aiProcessing: aiTime, saveResults: saveTime, total: totalTime }
    });
  } catch (error) {
    console.error("Error re-processing exam paper:", error);
    try {
      const supabaseClient = createServerSupabase();
      await supabaseClient.from("questions").update({ status: "pending", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    } catch (resetError) {
      console.error("Failed to reset question status:", resetError);
    }
    res.status(500).json({ error: "Failed to re-process exam paper" });
  }
});
adminRouter.post("/:id/generate-answer", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const { data: question, error: fetchError } = await supabase.from("questions").select("id, full_content, marks_scheme").eq("id", id).single();
    if (fetchError || !question) {
      res.status(404).json({ error: "Exam paper not found" });
      return;
    }
    if (!question.full_content) {
      res.status(400).json({ error: "No question content to generate answer from" });
      return;
    }
    const { ai: ai2 } = await Promise.resolve().then(() => (init_genkit(), genkit_exports));
    const { z: z5 } = await import("zod");
    const AnswerSchema = z5.object({
      answer: z5.string().describe("Comprehensive model answer"),
      explanation: z5.string().optional().describe("Step-by-step explanation")
    });
    const marksContext = question.marks_scheme && Array.isArray(question.marks_scheme) && question.marks_scheme.length > 0 ? `

Marks allocation:
${JSON.stringify(question.marks_scheme, null, 2)}

Structure your answer to address each sub-part.` : "";
    const startTime = Date.now();
    const { output } = await ai2.generate({
      prompt: `You are an expert academic tutor specializing in Nigerian university courses.

Given the following exam questions, write a comprehensive model answer.

Questions:
${question.full_content}${marksContext}

Rules:
- Answer ALL questions thoroughly
- For theory: detailed explanations with examples
- For MCQ: correct option with explanation
- If marks are allocated, match the marks weight
- Use clear formatting with question numbers

Return ONLY valid JSON matching the schema.`,
      output: { schema: AnswerSchema },
      config: { temperature: 0.3 }
    });
    const aiTime = Date.now() - startTime;
    console.log(`Answer generation completed in ${aiTime}ms`);
    if (!output) {
      throw new Error("AI failed to generate answer");
    }
    const saveStart = Date.now();
    const { error: updateError } = await supabase.from("questions").update({ answer_generated: output.answer, explanation: output.explanation, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    if (updateError) {
      throw new Error(`Failed to update: ${updateError.message}`);
    }
    const saveTime = Date.now() - saveStart;
    const { data: updated, error: fetchErr } = await supabase.from("questions").select("*").eq("id", id).single();
    if (fetchErr) throw fetchErr;
    res.json({ success: true, question: updated, message: "Answer generated successfully", timing: { aiProcessing: aiTime, saveResults: saveTime, total: aiTime + saveTime } });
  } catch (error) {
    console.error("Error generating answer:", error);
    res.status(500).json({ error: "Failed to generate answer" });
  }
});
adminRouter.post("/:id/:action", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const action = String(req.params.action);
  const user = res.locals.user;
  try {
    if (!["approve", "reject"].includes(action)) {
      res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
      return;
    }
    const supabase = createServerSupabase();
    const newStatus = action === "approve" ? "approved" : "rejected";
    const { data, error } = await supabase.from("questions").update({
      status: newStatus,
      approved_at: (/* @__PURE__ */ new Date()).toISOString(),
      approved_by: user.id,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "Question not found" });
      return;
    }
    res.json({
      success: true,
      question: data,
      message: `Question ${action}d successfully`
    });
  } catch (error) {
    console.error(`Error ${action}ing question:`, error);
    res.status(500).json({ error: `Failed to ${action} question` });
  }
});
var adminUsersRouter = Router2();
adminUsersRouter.get("/", requireAdmin, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const search = typeof req.query.search === "string" ? req.query.search : void 0;
    let query = supabase.from("user_profiles").select("*").order("created_at", { ascending: false });
    if (search) {
      query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
    }
    const { data: profiles, error: profileError } = await query.limit(100);
    if (profileError) throw profileError;
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;
    const authUserMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u]));
    const users = (profiles ?? []).map((profile) => {
      const authUser = authUserMap.get(profile.id);
      return {
        ...profile,
        email: authUser?.email ?? "Unknown",
        last_sign_in: authUser?.last_sign_in_at ?? null,
        email_confirmed: authUser?.email_confirmed_at != null
      };
    });
    const filtered = search ? users.filter(
      (u) => u.email.toLowerCase().includes(search.toLowerCase()) || (u.name ?? "").toLowerCase().includes(search.toLowerCase())
    ) : users;
    res.json(filtered);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
adminUsersRouter.post("/:id/promote", requireAdmin, async (req, res) => {
  const userId = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("user_profiles").update({ is_admin: true }).eq("id", userId).select().single();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ success: true, user: data, message: "User promoted to admin" });
  } catch (error) {
    console.error("Error promoting user:", error);
    res.status(500).json({ error: "Failed to promote user" });
  }
});
adminUsersRouter.post("/:id/demote", requireAdmin, async (req, res) => {
  const userId = String(req.params.id);
  const currentUser = res.locals.user;
  try {
    if (userId === currentUser.id) {
      res.status(400).json({ error: "You cannot remove your own admin privileges" });
      return;
    }
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("user_profiles").update({ is_admin: false }).eq("id", userId).select().single();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ success: true, user: data, message: "Admin privileges removed" });
  } catch (error) {
    console.error("Error demoting user:", error);
    res.status(500).json({ error: "Failed to demote user" });
  }
});

// server/routes/analytics.ts
init_supabase_server();
init_middleware();
import { Router as Router3 } from "express";

// src/lib/analytics-summary.ts
var FUNNELS = [
  { name: "Discovery \u2192 Answer", steps: ["search_performed", "question_viewed", "answer_revealed"] },
  { name: "Upload Flow", steps: ["upload_dialog_opened", "upload_submitted"] }
];
function daysAgoISO(days) {
  return new Date(Date.now() - days * 864e5).toISOString();
}
async function fetchEvents(supabase, days) {
  const { data, error } = await supabase.from("events").select("id, session_id, user_id, event_name, page, created_at").gte("created_at", daysAgoISO(days)).order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
function computeOverview(events, sessionDurations) {
  const pageViews = events.filter((e) => e.event_name === "page_view").length;
  const sessionIds = new Set(events.map((e) => e.session_id).filter(Boolean));
  const userIds = new Set(events.map((e) => e.user_id).filter(Boolean));
  const durations = sessionDurations.filter((d) => d > 0);
  const avgSessionDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  return {
    sessions: sessionIds.size,
    pageViews,
    uniqueUsers: userIds.size,
    avgSessionDuration,
    totalEvents: events.length
  };
}
async function fetchOverview(supabase, days) {
  const since = daysAgoISO(days);
  const [events, sessions] = await Promise.all([
    fetchEvents(supabase, days),
    supabase.from("sessions").select("duration_seconds").gte("last_seen_at", since)
  ]);
  const durations = (sessions.data ?? []).map(
    (s) => s.duration_seconds ?? 0
  );
  return computeOverview(events, durations);
}
function buildSeries(events, days, now = /* @__PURE__ */ new Date()) {
  const byDay = /* @__PURE__ */ new Map();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 864e5);
    const date = d.toISOString().slice(0, 10);
    byDay.set(date, { date, pageViews: 0, events: 0, sessions: 0, _sessions: /* @__PURE__ */ new Set() });
  }
  for (const e of events) {
    const row = byDay.get(e.created_at.slice(0, 10));
    if (!row) continue;
    row.events += 1;
    if (e.event_name === "page_view") row.pageViews += 1;
    if (e.session_id) row._sessions.add(e.session_id);
  }
  return [...byDay.values()].map(({ _sessions, ...r }) => ({ ...r, sessions: _sessions.size }));
}
function buildTopPages(events, limit = 15) {
  const counts = /* @__PURE__ */ new Map();
  for (const e of events) {
    if (e.event_name !== "page_view" || !e.page) continue;
    counts.set(e.page, (counts.get(e.page) ?? 0) + 1);
  }
  return [...counts.entries()].map(([page, views]) => ({ page, views })).sort((a, b) => b.views - a.views).slice(0, limit);
}
function buildTopEvents(events, limit = 20) {
  const counts = /* @__PURE__ */ new Map();
  for (const e of events) {
    if (e.event_name === "page_view") continue;
    counts.set(e.event_name, (counts.get(e.event_name) ?? 0) + 1);
  }
  return [...counts.entries()].map(([event, count]) => ({ event, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}
function buildFunnels(events) {
  const perSession = /* @__PURE__ */ new Map();
  for (const e of events) {
    if (!e.session_id) continue;
    if (!perSession.has(e.session_id)) perSession.set(e.session_id, []);
    perSession.get(e.session_id).push({ event: e.event_name, at: e.created_at });
  }
  return FUNNELS.map((funnel) => {
    let reached = /* @__PURE__ */ new Set();
    const steps = [];
    funnel.steps.forEach((step, idx) => {
      const next = /* @__PURE__ */ new Set();
      for (const [sessionId, eventsList] of perSession) {
        if (idx === 0) {
          if (eventsList.some((e) => e.event === step)) next.add(sessionId);
          continue;
        }
        const prevIdx = eventsList.findIndex((e) => e.event === funnel.steps[idx - 1]);
        if (prevIdx === -1) continue;
        if (eventsList.slice(prevIdx).some((e) => e.event === step)) next.add(sessionId);
      }
      const conversion = idx === 0 || reached.size === 0 ? null : next.size / reached.size;
      reached = next;
      steps.push({ event: step, sessions: reached.size, conversion });
    });
    return { name: funnel.name, steps };
  });
}
async function buildSummary(supabase, days) {
  const since = daysAgoISO(days);
  const [events, sessions] = await Promise.all([
    fetchEvents(supabase, days),
    supabase.from("sessions").select("duration_seconds").gte("last_seen_at", since)
  ]);
  const durations = (sessions.data ?? []).map(
    (s) => s.duration_seconds ?? 0
  );
  return {
    overview: computeOverview(events, durations),
    series: buildSeries(events, days),
    topPages: buildTopPages(events),
    topEvents: buildTopEvents(events),
    funnels: buildFunnels(events)
  };
}

// server/routes/analytics.ts
var analyticsRouter = Router3();
analyticsRouter.post("/", async (req, res) => {
  try {
    const { sessionId, eventName, page, metadata, durationSeconds } = req.body ?? {};
    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 64) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }
    if (!eventName || typeof eventName !== "string" || eventName.length > 64) {
      res.status(400).json({ error: "eventName is required" });
      return;
    }
    let userId = null;
    if (getBearerToken(req)) {
      const user = await getUserFromRequest(req);
      if (user) userId = user.id;
    }
    const supabase = createServerSupabase();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const isPageView = eventName === "page_view";
    const duration = typeof durationSeconds === "number" && Number.isFinite(durationSeconds) ? Math.max(0, Math.round(durationSeconds)) : null;
    const { data: existing } = await supabase.from("sessions").select("id, page_views").eq("id", sessionId).maybeSingle();
    if (!existing) {
      await supabase.from("sessions").insert({
        id: sessionId,
        user_id: userId,
        started_at: now,
        last_seen_at: now,
        user_agent: String(req.headers["user-agent"] || "").slice(0, 300) || null,
        referrer: String(req.headers.referer || "").slice(0, 500) || null,
        page_views: isPageView ? 1 : 0,
        duration_seconds: duration ?? 0
      });
    } else {
      const update = {
        last_seen_at: now,
        user_id: userId,
        // attach identity if the user logged in mid-session
        page_views: (existing.page_views ?? 0) + (isPageView ? 1 : 0)
      };
      if (duration !== null) update.duration_seconds = duration;
      await supabase.from("sessions").update(update).eq("id", sessionId);
    }
    await supabase.from("events").insert({
      session_id: sessionId,
      user_id: userId,
      event_name: eventName,
      page: typeof page === "string" ? page.slice(0, 200) : null,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
      created_at: now
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("Error recording event:", error);
    res.json({ ok: true });
  }
});
var adminAnalyticsRouter = Router3();
adminAnalyticsRouter.use(requireAdmin);
adminAnalyticsRouter.get("/overview", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    res.json(await fetchOverview(createServerSupabase(), days));
  } catch (error) {
    console.error("Error loading analytics overview:", error);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});
adminAnalyticsRouter.get("/series", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(createServerSupabase(), days);
    res.json(buildSeries(events, days));
  } catch (error) {
    console.error("Error loading analytics series:", error);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});
adminAnalyticsRouter.get("/pages", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(createServerSupabase(), days);
    res.json(buildTopPages(events));
  } catch (error) {
    console.error("Error loading analytics pages:", error);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});
adminAnalyticsRouter.get("/events", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(createServerSupabase(), days);
    res.json(buildTopEvents(events));
  } catch (error) {
    console.error("Error loading analytics events:", error);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});
adminAnalyticsRouter.get("/funnels", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(createServerSupabase(), days);
    res.json(buildFunnels(events));
  } catch (error) {
    console.error("Error loading analytics funnels:", error);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

// server/routes/feedback.ts
init_supabase_server();
import { Router as Router4 } from "express";

// node_modules/express-rate-limit/dist/index.mjs
var import_ip_address = __toESM(require_ip_address(), 1);
import { isIPv6 } from "node:net";
import { isIPv6 as isIPv62 } from "node:net";
import createDebugLogger from "debug";
import { Buffer as Buffer2 } from "node:buffer";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
var ipv4CompatibleSubnet = new import_ip_address.Address6("::/96");
function ipKeyGenerator(ip, ipv6Subnet = 56) {
  if (isIPv6(ip)) {
    const address = new import_ip_address.Address6(ip);
    if (address.isMapped4() || // The deprecated IPv4-compatible notation keeps its existing behavior.
    // Its range is shared with addresses that embed no IPv4 address at all
    // (`::`, `::1`), so here the notation is what tells them apart.
    address.is4() && address.isInSubnet(ipv4CompatibleSubnet))
      return address.to4().correctForm();
    if (ipv6Subnet) {
      const subnet = new import_ip_address.Address6(`${ip}/${ipv6Subnet}`);
      return subnet.networkForm();
    }
  }
  return ip;
}
var MemoryStore = class {
  constructor(validations2) {
    this.validations = validations2;
    this.previous = /* @__PURE__ */ new Map();
    this.current = /* @__PURE__ */ new Map();
    this.localKeys = true;
  }
  /**
   * Method that initializes the store.
   *
   * @param options {Options} - The options used to setup the middleware.
   */
  init(options) {
    this.windowMs = options.windowMs;
    this.validations?.windowMs(this.windowMs);
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.clearExpired();
    }, this.windowMs);
    this.interval.unref?.();
  }
  /**
   * Method to fetch a client's hit count and reset time.
   *
   * @param key {string} - The identifier for a client.
   *
   * @returns {ClientRateLimitInfo | undefined} - The number of hits and reset time for that client.
   *
   * @public
   */
  async get(key) {
    return this.current.get(key) ?? this.previous.get(key);
  }
  /**
   * Method to increment a client's hit counter.
   *
   * @param key {string} - The identifier for a client.
   *
   * @returns {ClientRateLimitInfo} - The number of hits and reset time for that client.
   *
   * @public
   */
  async increment(key) {
    const client = this.getClient(key);
    const now = Date.now();
    if (client.resetTime.getTime() <= now) {
      this.resetClient(client, now);
    }
    client.totalHits++;
    return client;
  }
  /**
   * Method to decrement a client's hit counter.
   *
   * @param key {string} - The identifier for a client.
   *
   * @public
   */
  async decrement(key) {
    const client = this.getClient(key);
    if (client.totalHits > 0) client.totalHits--;
  }
  /**
   * Method to reset a client's hit counter.
   *
   * @param key {string} - The identifier for a client.
   *
   * @public
   */
  async resetKey(key) {
    this.current.delete(key);
    this.previous.delete(key);
  }
  /**
   * Method to reset everyone's hit counter.
   *
   * @public
   */
  async resetAll() {
    this.current.clear();
    this.previous.clear();
  }
  /**
   * Method to stop the timer (if currently running) and prevent any memory
   * leaks.
   *
   * @public
   */
  shutdown() {
    clearInterval(this.interval);
    void this.resetAll();
  }
  /**
   * Recycles a client by setting its hit count to zero, and reset time to
   * `windowMs` milliseconds from now.
   *
   * NOT to be confused with `#resetKey()`, which removes a client from both the
   * `current` and `previous` maps.
   *
   * @param client {Client} - The client to recycle.
   * @param now {number} - The current time, to which the `windowMs` is added to get the `resetTime` for the client.
   *
   * @return {Client} - The modified client that was passed in, to allow for chaining.
   */
  resetClient(client, now = Date.now()) {
    client.totalHits = 0;
    client.resetTime.setTime(now + this.windowMs);
    return client;
  }
  /**
   * Retrieves or creates a client, given a key. Also ensures that the client being
   * returned is in the `current` map.
   *
   * @param key {string} - The key under which the client is (or is to be) stored.
   *
   * @returns {Client} - The requested client.
   */
  getClient(key) {
    if (this.current.has(key)) return this.current.get(key);
    let client;
    if (this.previous.has(key)) {
      client = this.previous.get(key);
      this.previous.delete(key);
    } else {
      client = { totalHits: 0, resetTime: /* @__PURE__ */ new Date() };
      this.resetClient(client);
    }
    this.current.set(key, client);
    return client;
  }
  /**
   * Move current clients to previous, create a new map for current.
   *
   * This function is called every `windowMs`.
   */
  clearExpired() {
    this.previous = this.current;
    this.current = /* @__PURE__ */ new Map();
  }
};
var ConsoleLogger = {
  warn(...args) {
    console.warn(...args.reverse());
  },
  error(...args) {
    console.error(...args.reverse());
  }
};
var SUPPORTED_DRAFT_VERSIONS = [
  "draft-6",
  "draft-7",
  "draft-8"
];
var getResetSeconds = (windowMs, resetTime) => {
  let resetSeconds;
  if (resetTime) {
    const deltaSeconds = Math.ceil((resetTime.getTime() - Date.now()) / 1e3);
    resetSeconds = Math.max(0, deltaSeconds);
  } else {
    resetSeconds = Math.ceil(windowMs / 1e3);
  }
  return resetSeconds;
};
var getPartitionKey = (key) => {
  const hash = createHash("sha256");
  hash.update(key);
  const partitionKey = hash.digest("hex").slice(0, 12);
  return Buffer2.from(partitionKey).toString("base64");
};
var setLegacyHeaders = (response, info) => {
  if (response.headersSent) return;
  response.setHeader("X-RateLimit-Limit", info.limit.toString());
  response.setHeader("X-RateLimit-Remaining", info.remaining.toString());
  if (info.resetTime instanceof Date) {
    response.setHeader("Date", (/* @__PURE__ */ new Date()).toUTCString());
    response.setHeader(
      "X-RateLimit-Reset",
      Math.ceil(info.resetTime.getTime() / 1e3).toString()
    );
  }
};
var setDraft6Headers = (response, info, windowMs) => {
  if (response.headersSent) return;
  const windowSeconds = Math.ceil(windowMs / 1e3);
  const resetSeconds = getResetSeconds(windowMs, info.resetTime);
  response.setHeader("RateLimit-Policy", `${info.limit};w=${windowSeconds}`);
  response.setHeader("RateLimit-Limit", info.limit.toString());
  response.setHeader("RateLimit-Remaining", info.remaining.toString());
  if (typeof resetSeconds === "number")
    response.setHeader("RateLimit-Reset", resetSeconds.toString());
};
var setDraft7Headers = (response, info, windowMs) => {
  if (response.headersSent) return;
  const windowSeconds = Math.ceil(windowMs / 1e3);
  const resetSeconds = getResetSeconds(windowMs, info.resetTime);
  response.setHeader("RateLimit-Policy", `${info.limit};w=${windowSeconds}`);
  response.setHeader(
    "RateLimit",
    `limit=${info.limit}, remaining=${info.remaining}, reset=${resetSeconds}`
  );
};
var setDraft8Headers = (response, info, windowMs, name, key) => {
  if (response.headersSent) return;
  const windowSeconds = Math.ceil(windowMs / 1e3);
  const resetSeconds = getResetSeconds(windowMs, info.resetTime);
  const partitionKey = getPartitionKey(key);
  const header = `r=${info.remaining}; t=${resetSeconds}`;
  const policy = `q=${info.limit}; w=${windowSeconds}; pk=:${partitionKey}:`;
  response.append("RateLimit", `"${name}"; ${header}`);
  response.append("RateLimit-Policy", `"${name}"; ${policy}`);
};
var setRetryAfterHeader = (response, info, windowMs, retryAfter) => {
  if (response.headersSent) return;
  const resetSeconds = retryAfter ?? getResetSeconds(windowMs, info.resetTime);
  response.setHeader("Retry-After", resetSeconds.toString());
};
var omitUndefinedProperties = (passedOptions) => {
  const omittedOptions = {};
  for (const k of Object.keys(passedOptions)) {
    const key = k;
    if (passedOptions[key] !== void 0) {
      omittedOptions[key] = passedOptions[key];
    }
  }
  return omittedOptions;
};
var ValidationError = class extends Error {
  /**
   * The code must be a string, in snake case and all capital, that starts with
   * the substring `ERR_ERL_`.
   *
   * The message must be a string, starting with an uppercase character,
   * describing the issue in detail.
   */
  constructor(code, message) {
    const url = `https://express-rate-limit.github.io/${code}/`;
    super(`${message} See ${url} for more information.`);
    this.name = this.constructor.name;
    this.code = code;
    this.help = url;
  }
};
var ChangeWarning = class extends ValidationError {
};
var usedStores = /* @__PURE__ */ new Set();
var singleCountKeys = /* @__PURE__ */ new WeakMap();
var validations = {
  enabled: {
    default: true
  },
  // Should be EnabledValidations type, but that's a circular reference
  disable() {
    for (const k of Object.keys(this.enabled)) this.enabled[k] = false;
  },
  /**
   * Checks whether the IP address is valid, and that it does not have a port
   * number in it.
   *
   * See https://github.com/express-rate-limit/express-rate-limit/wiki/Error-Codes#err_erl_invalid_ip_address.
   *
   * @param ip {string | undefined} - The IP address provided by Express as request.ip.
   *
   * @returns {void}
   */
  ip(ip) {
    if (ip === void 0) {
      throw new ValidationError(
        "ERR_ERL_UNDEFINED_IP_ADDRESS",
        `An undefined 'request.ip' was detected. This might indicate a misconfiguration or the connection being destroyed prematurely.`
      );
    }
    if (!isIP(ip)) {
      throw new ValidationError(
        "ERR_ERL_INVALID_IP_ADDRESS",
        `An invalid 'request.ip' (${ip}) was detected. Consider passing a custom 'keyGenerator' function to the rate limiter.`
      );
    }
  },
  /**
   * Makes sure the trust proxy setting is not set to `true`.
   *
   * See https://github.com/express-rate-limit/express-rate-limit/wiki/Error-Codes#err_erl_permissive_trust_proxy.
   *
   * @param request {Request} - The Express request object.
   *
   * @returns {void}
   */
  trustProxy(request) {
    if (request.app.get("trust proxy") === true) {
      throw new ValidationError(
        "ERR_ERL_PERMISSIVE_TRUST_PROXY",
        `The Express 'trust proxy' setting is true, which allows anyone to trivially bypass IP-based rate limiting.`
      );
    }
  },
  /**
   * Makes sure the trust proxy setting is set in case the `X-Forwarded-For`
   * header is present.
   *
   * See https://github.com/express-rate-limit/express-rate-limit/wiki/Error-Codes#err_erl_unset_trust_proxy.
   *
   * @param request {Request} - The Express request object.
   *
   * @returns {void}
   */
  xForwardedForHeader(request) {
    if (request.headers["x-forwarded-for"] && request.app.get("trust proxy") === false) {
      throw new ValidationError(
        "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR",
        `The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false (default). This could indicate a misconfiguration which would prevent express-rate-limit from accurately identifying users.`
      );
    }
  },
  /**
   * Alert the user if the Forwarded header is set (standardized version of X-Forwarded-For - not supported by express as of version 5.1.0)
   *
   * @param request {Request} - The Express request object.
   *
   * @returns {void}
   */
  forwardedHeader(request) {
    if (request.headers.forwarded && request.ip === request.socket?.remoteAddress) {
      throw new ValidationError(
        "ERR_ERL_FORWARDED_HEADER",
        `The 'Forwarded' header (standardized X-Forwarded-For) is set but currently being ignored. Add a custom keyGenerator to use a value from this header.`
      );
    }
  },
  /**
   * Ensures totalHits value from store is a positive integer.
   *
   * @param hits {any} - The `totalHits` returned by the store.
   */
  positiveHits(hits) {
    if (typeof hits !== "number" || hits < 1 || hits !== Math.round(hits)) {
      throw new ValidationError(
        "ERR_ERL_INVALID_HITS",
        `The totalHits value returned from the store must be a positive integer, got ${hits}`
      );
    }
  },
  /**
   * Ensures a single store instance is not used with multiple express-rate-limit instances
   */
  unsharedStore(store) {
    if (usedStores.has(store)) {
      const maybeUniquePrefix = store?.localKeys ? "" : " (with a unique prefix)";
      throw new ValidationError(
        "ERR_ERL_STORE_REUSE",
        `A Store instance must not be shared across multiple rate limiters. Create a new instance of ${store.constructor.name}${maybeUniquePrefix} for each limiter instead.`
      );
    }
    usedStores.add(store);
  },
  /**
   * Ensures a given key is incremented only once per request.
   *
   * @param request {Request} - The Express request object.
   * @param store {Store} - The store class.
   * @param key {string} - The key used to store the client's hit count.
   *
   * @returns {void}
   */
  singleCount(request, store, key) {
    let storeKeys = singleCountKeys.get(request);
    if (!storeKeys) {
      storeKeys = /* @__PURE__ */ new Map();
      singleCountKeys.set(request, storeKeys);
    }
    const storeKey = store.localKeys ? store : store.constructor.name;
    let keys = storeKeys.get(storeKey);
    if (!keys) {
      keys = [];
      storeKeys.set(storeKey, keys);
    }
    const prefixedKey = `${store.prefix ?? ""}${key}`;
    if (keys.includes(prefixedKey)) {
      throw new ValidationError(
        "ERR_ERL_DOUBLE_COUNT",
        `The hit count for ${key} was incremented more than once for a single request.`
      );
    }
    keys.push(prefixedKey);
  },
  /**
   * Warns the user that the behaviour for `max: 0` / `limit: 0` is
   * changing in the next major release.
   *
   * @param limit {number} - The maximum number of hits per client.
   *
   * @returns {void}
   */
  limit(limit) {
    if (limit === 0) {
      throw new ChangeWarning(
        "WRN_ERL_MAX_ZERO",
        "Setting limit or max to 0 disables rate limiting in express-rate-limit v6 and older, but will cause all requests to be blocked in v7"
      );
    }
  },
  /**
   * Warns the user that the `draft_polli_ratelimit_headers` option is deprecated
   * and will be removed in the next major release.
   *
   * @param draft_polli_ratelimit_headers {any | undefined} - The now-deprecated setting that was used to enable standard headers.
   *
   * @returns {void}
   */
  draftPolliHeaders(draft_polli_ratelimit_headers) {
    if (draft_polli_ratelimit_headers) {
      throw new ChangeWarning(
        "WRN_ERL_DEPRECATED_DRAFT_POLLI_HEADERS",
        `The draft_polli_ratelimit_headers configuration option is deprecated and has been removed in express-rate-limit v7, please set standardHeaders: 'draft-6' instead.`
      );
    }
  },
  /**
   * Warns the user that the `onLimitReached` option is deprecated and
   * will be removed in the next major release.
   *
   * @param onLimitReached {any | undefined} - The maximum number of hits per client.
   *
   * @returns {void}
   */
  onLimitReached(onLimitReached) {
    if (onLimitReached) {
      throw new ChangeWarning(
        "WRN_ERL_DEPRECATED_ON_LIMIT_REACHED",
        "The onLimitReached configuration option is deprecated and has been removed in express-rate-limit v7."
      );
    }
  },
  /**
   * Warns the user when an invalid/unsupported version of the draft spec is passed.
   *
   * @param version {any | undefined} - The version passed by the user.
   *
   * @returns {void}
   */
  headersDraftVersion(version) {
    if (typeof version !== "string" || // @ts-expect-error This is fine. If version is not in the array, it will just return false.
    !SUPPORTED_DRAFT_VERSIONS.includes(version)) {
      const versionString = SUPPORTED_DRAFT_VERSIONS.join(", ");
      throw new ValidationError(
        "ERR_ERL_HEADERS_UNSUPPORTED_DRAFT_VERSION",
        `standardHeaders: only the following versions of the IETF draft specification are supported: ${versionString}.`
      );
    }
  },
  /**
   * Warns the user when the selected headers option requires a reset time but
   * the store does not provide one.
   *
   * @param resetTime {Date | undefined} - The timestamp when the client's hit count will be reset.
   *
   * @returns {void}
   */
  headersResetTime(resetTime) {
    if (!resetTime) {
      throw new ValidationError(
        "ERR_ERL_HEADERS_NO_RESET",
        `standardHeaders:  'draft-7' requires a 'resetTime', but the store did not provide one. The 'windowMs' value will be used instead, which may cause clients to wait longer than necessary.`
      );
    }
  },
  knownOptions(passedOptions) {
    if (!passedOptions) return;
    const optionsMap = {
      windowMs: true,
      limit: true,
      message: true,
      statusCode: true,
      legacyHeaders: true,
      standardHeaders: true,
      identifier: true,
      retryAfter: true,
      requestPropertyName: true,
      skipFailedRequests: true,
      skipSuccessfulRequests: true,
      keyGenerator: true,
      ipv6Subnet: true,
      handler: true,
      skip: true,
      requestWasSuccessful: true,
      store: true,
      validate: true,
      headers: true,
      max: true,
      passOnStoreError: true,
      logger: true
    };
    const validOptions = Object.keys(optionsMap).concat(
      "draft_polli_ratelimit_headers",
      // not a valid option anymore, but we have a more specific check for this one, so don't warn for it here
      // from express-slow-down - https://github.com/express-rate-limit/express-slow-down/blob/main/source/types.ts#L65
      "delayAfter",
      "delayMs",
      "maxDelayMs"
    );
    for (const key of Object.keys(passedOptions)) {
      if (!validOptions.includes(key)) {
        throw new ValidationError(
          "ERR_ERL_UNKNOWN_OPTION",
          `Unexpected configuration option: ${key}`
          // todo: suggest a valid option with a short levenstein distance?
        );
      }
    }
  },
  /**
   * Checks the options.validate setting to ensure that only recognized
   * validations are enabled or disabled.
   *
   * If any unrecognized values are found, an error is logged that
   * includes the list of supported validations.
   */
  validationsConfig() {
    const supportedValidations = Object.keys(this).filter(
      (k) => !["enabled", "disable"].includes(k)
    );
    supportedValidations.push("default");
    for (const key of Object.keys(this.enabled)) {
      if (!supportedValidations.includes(key)) {
        throw new ValidationError(
          "ERR_ERL_UNKNOWN_VALIDATION",
          `options.validate.${key} is not recognized. Supported validate options are: ${supportedValidations.join(
            ", "
          )}.`
        );
      }
    }
  },
  /**
   * Checks to see if the instance was created inside of a request handler,
   * which would prevent it from working correctly, with the default memory
   * store (or any other store with localKeys.)
   */
  creationStack(store) {
    const { stack } = new Error(
      "express-rate-limit validation check (set options.validate.creationStack=false to disable)"
    );
    if (stack?.includes("Layer.handle [as handle_request]") || // express v4
    stack?.includes("Layer.handleRequest")) {
      if (!store.localKeys) {
        throw new ValidationError(
          "ERR_ERL_CREATED_IN_REQUEST_HANDLER",
          "express-rate-limit instance should *usually* be created at app initialization, not when responding to a request."
        );
      }
      throw new ValidationError(
        "ERR_ERL_CREATED_IN_REQUEST_HANDLER",
        "express-rate-limit instance should be created at app initialization, not when responding to a request."
      );
    }
  },
  ipv6Subnet(ipv6Subnet) {
    if (ipv6Subnet === false) {
      return;
    }
    if (!Number.isInteger(ipv6Subnet) || ipv6Subnet < 32 || ipv6Subnet > 64) {
      throw new ValidationError(
        "ERR_ERL_IPV6_SUBNET",
        `Unexpected ipv6Subnet value: ${ipv6Subnet}. Expected an integer between 32 and 64 (usually 48-64).`
      );
    }
  },
  ipv6SubnetOrKeyGenerator(options) {
    if (options.ipv6Subnet !== void 0 && options.keyGenerator) {
      throw new ValidationError(
        "ERR_ERL_IPV6SUBNET_OR_KEYGENERATOR",
        `Incompatible options: the 'ipv6Subnet' option is ignored when a custom 'keyGenerator' function is also set.`
      );
    }
  },
  keyGeneratorIpFallback(keyGenerator) {
    if (!keyGenerator) {
      return;
    }
    const src = keyGenerator.toString();
    if ((src.includes("req.ip") || src.includes("request.ip")) && !src.includes("ipKeyGenerator")) {
      throw new ValidationError(
        "ERR_ERL_KEY_GEN_IPV6",
        "Custom keyGenerator appears to use request IP without calling the ipKeyGenerator helper function for IPv6 addresses. This could allow IPv6 users to bypass limits."
      );
    }
  },
  /**
   * Checks to see if the window duration is greater than 2^32 - 1. This is only
   * called by the default MemoryStore, since it uses Node's setInterval method.
   *
   * See https://nodejs.org/api/timers.html#setintervalcallback-delay-args.
   */
  windowMs(windowMs) {
    const SET_TIMEOUT_MAX = 2 ** 31 - 1;
    if (typeof windowMs !== "number" || Number.isNaN(windowMs) || windowMs < 1 || windowMs > SET_TIMEOUT_MAX) {
      throw new ValidationError(
        "ERR_ERL_WINDOW_MS",
        `Invalid windowMs value: ${windowMs}${typeof windowMs !== "number" ? ` (${typeof windowMs})` : ""}, must be a number between 1 and ${SET_TIMEOUT_MAX} when using the default MemoryStore`
      );
    }
  }
};
function validateLogger(logger) {
  if (typeof logger !== "object" || typeof logger.error !== "function" || typeof logger.warn !== "function") {
    throw new TypeError(
      "Provided logger does not implement the Logger interface"
    );
  }
}
var getValidations = (_enabled, logger) => {
  validateLogger(logger);
  let enabled;
  if (typeof _enabled === "boolean") {
    enabled = {
      default: _enabled
    };
  } else {
    enabled = {
      default: true,
      ..._enabled
    };
  }
  const wrappedValidations = { enabled };
  for (const [name, validation] of Object.entries(validations)) {
    if (typeof validation === "function")
      wrappedValidations[name] = (...args) => {
        if (!(enabled[name] ?? enabled.default)) {
          return;
        }
        enabled[name] = false;
        try {
          ;
          validation.apply(
            wrappedValidations,
            args
          );
        } catch (error) {
          if (error instanceof ChangeWarning) logger.warn(error);
          else logger.error(error);
        }
      };
  }
  const inspect = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
  if (inspect)
    wrappedValidations[inspect] = () => wrappedValidations.enabled;
  return wrappedValidations;
};
var isLegacyStore = (store) => (
  // Check that `incr` exists but `increment` does not - store authors might want
  // to keep both around for backwards compatibility.
  typeof store.incr === "function" && typeof store.increment !== "function"
);
var promisifyStore = (passedStore) => {
  if (!isLegacyStore(passedStore)) {
    return passedStore;
  }
  const legacyStore = passedStore;
  class PromisifiedStore {
    async increment(key) {
      return new Promise((resolve, reject) => {
        legacyStore.incr(
          key,
          (error, totalHits, resetTime) => {
            if (error) reject(error);
            resolve({ totalHits, resetTime });
          }
        );
      });
    }
    async decrement(key) {
      return legacyStore.decrement(key);
    }
    async resetKey(key) {
      return legacyStore.resetKey(key);
    }
    /* istanbul ignore next */
    async resetAll() {
      if (typeof legacyStore.resetAll === "function")
        return legacyStore.resetAll();
    }
  }
  return new PromisifiedStore();
};
var getOptionsFromConfig = (config) => {
  const { validations: validations2, ...directlyPassableEntries } = config;
  return {
    ...directlyPassableEntries,
    validate: validations2.enabled
  };
};
var parseOptions = (passedOptions) => {
  const notUndefinedOptions = omitUndefinedProperties(passedOptions);
  const logger = passedOptions.logger ?? ConsoleLogger;
  const validations2 = getValidations(
    notUndefinedOptions?.validate ?? true,
    logger
  );
  validations2.validationsConfig();
  validations2.knownOptions(passedOptions);
  validations2.draftPolliHeaders(
    // @ts-expect-error see the note above.
    notUndefinedOptions.draft_polli_ratelimit_headers
  );
  validations2.onLimitReached(notUndefinedOptions.onLimitReached);
  if (notUndefinedOptions.ipv6Subnet !== void 0 && typeof notUndefinedOptions.ipv6Subnet !== "function") {
    validations2.ipv6Subnet(notUndefinedOptions.ipv6Subnet);
  }
  validations2.keyGeneratorIpFallback(notUndefinedOptions.keyGenerator);
  validations2.ipv6SubnetOrKeyGenerator(notUndefinedOptions);
  let standardHeaders = notUndefinedOptions.standardHeaders ?? false;
  if (standardHeaders === true) standardHeaders = "draft-6";
  const config = {
    windowMs: 60 * 1e3,
    limit: passedOptions.max ?? 5,
    // `max` is deprecated, but support it anyways.
    message: "Too many requests, please try again later.",
    statusCode: 429,
    legacyHeaders: passedOptions.headers ?? true,
    identifier(request, _response) {
      let duration = "";
      const property = config.requestPropertyName;
      const { limit } = request[property];
      const seconds = config.windowMs / 1e3;
      const minutes = config.windowMs / (1e3 * 60);
      const hours = config.windowMs / (1e3 * 60 * 60);
      const days = config.windowMs / (1e3 * 60 * 60 * 24);
      if (seconds < 60) duration = `${seconds}sec`;
      else if (minutes < 60) duration = `${minutes}min`;
      else if (hours < 24) duration = `${hours}hr${hours > 1 ? "s" : ""}`;
      else duration = `${days}day${days > 1 ? "s" : ""}`;
      return `${limit}-in-${duration}`;
    },
    requestPropertyName: "rateLimit",
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    requestWasSuccessful: (_request, response) => response.statusCode < 400,
    skip: (_request, _response) => false,
    async keyGenerator(request, response) {
      validations2.ip(request.ip);
      validations2.trustProxy(request);
      validations2.xForwardedForHeader(request);
      validations2.forwardedHeader(request);
      const ip = request.ip;
      let subnet = 56;
      if (isIPv62(ip)) {
        subnet = typeof config.ipv6Subnet === "function" ? await config.ipv6Subnet(request, response) : config.ipv6Subnet;
        if (typeof config.ipv6Subnet === "function")
          validations2.ipv6Subnet(subnet);
      }
      return ipKeyGenerator(ip, subnet);
    },
    ipv6Subnet: 56,
    async handler(request, response, _next, _optionsUsed) {
      response.status(config.statusCode);
      const message = typeof config.message === "function" ? await config.message(
        request,
        response
      ) : config.message;
      if (!response.writableEnded) response.send(message);
    },
    passOnStoreError: false,
    // Allow the default options to be overridden by the passed options.
    ...notUndefinedOptions,
    // `standardHeaders` is resolved into a draft version above, use that.
    standardHeaders,
    // Note that this field is declared after the user's options are spread in,
    // so that this field doesn't get overridden with an un-promisified store!
    store: promisifyStore(
      notUndefinedOptions.store ?? new MemoryStore(validations2)
    ),
    // Print an error to the console if a few known misconfigurations are detected.
    validations: validations2,
    logger
  };
  if (typeof config.store.increment !== "function" || typeof config.store.decrement !== "function" || typeof config.store.resetKey !== "function" || config.store.resetAll !== void 0 && typeof config.store.resetAll !== "function" || config.store.init !== void 0 && typeof config.store.init !== "function") {
    throw new TypeError(
      "An invalid store was passed. Please ensure that the store is a class that implements the `Store` interface."
    );
  }
  return config;
};
var handleAsyncErrors = (fn) => async (request, response, next) => {
  try {
    await Promise.resolve(fn(request, response, next)).catch(next);
  } catch (error) {
    next(error);
  }
};
var rateLimit = (passedOptions) => {
  const config = parseOptions(passedOptions ?? {});
  const options = getOptionsFromConfig(config);
  const debug = createDebugLogger("express-rate-limit");
  debug("creating new rate limiter with %o", config.store.constructor.name);
  for (const [key, val] of Object.entries(config))
    debug("set %s to %o", key, val);
  config.validations.creationStack(config.store);
  config.validations.unsharedStore(config.store);
  if (typeof config.store.init === "function") {
    debug("executing init for store");
    try {
      const storeInit = config.store.init(options);
      if (storeInit instanceof Promise) {
        storeInit.catch(
          (error) => config.logger.error(
            error,
            "express-rate-limit: async error during store initialization."
          )
        );
      }
    } catch (error) {
      config.logger.error(
        error,
        "express-rate-limit: error during store initialization."
      );
    }
  }
  const middleware = handleAsyncErrors(
    async (request, response, next) => {
      const closePromise = config.skipFailedRequests && new Promise((resolve) => response.once("close", resolve));
      const finishPromise = (config.skipFailedRequests || config.skipSuccessfulRequests) && new Promise((resolve) => response.once("finish", resolve));
      const errorPromise = config.skipFailedRequests && new Promise((resolve) => response.once("error", resolve));
      debug("requested %o", request.originalUrl);
      debug("request from ip %o", request.ip);
      const skip = await config.skip(request, response);
      if (skip) {
        debug("skipping request");
        next();
        return;
      }
      const augmentedRequest = request;
      const key = await config.keyGenerator(request, response);
      debug("computed key %o", key);
      debug("incrementing count");
      let totalHits = 0;
      let resetTime;
      try {
        const incrementResult = await config.store.increment(key);
        totalHits = incrementResult.totalHits;
        resetTime = incrementResult.resetTime;
      } catch (error) {
        if (config.passOnStoreError) {
          config.logger.error(
            error,
            "express-rate-limit: error from store, allowing request without rate-limiting."
          );
          next();
          return;
        }
        throw error;
      }
      config.validations.positiveHits(totalHits);
      config.validations.singleCount(request, config.store, key);
      const retrieveLimit = typeof config.limit === "function" ? config.limit(request, response) : config.limit;
      const limit = await retrieveLimit;
      config.validations.limit(limit);
      const info = {
        limit,
        used: totalHits,
        remaining: Math.max(limit - totalHits, 0),
        resetTime,
        key
      };
      for (const [key2, val] of Object.entries(info))
        debug(
          "set request.%s.%s to be %o",
          config.requestPropertyName,
          key2,
          val
        );
      Object.defineProperty(info, "current", {
        configurable: false,
        enumerable: false,
        value: totalHits
      });
      augmentedRequest[config.requestPropertyName] = info;
      if (config.legacyHeaders && !response.headersSent) {
        debug("set legacy headers");
        setLegacyHeaders(response, info);
      }
      if (config.standardHeaders && !response.headersSent) {
        switch (config.standardHeaders) {
          case "draft-6": {
            debug("set ietf draft 6 headers");
            setDraft6Headers(response, info, config.windowMs);
            break;
          }
          case "draft-7": {
            debug("set ietf draft 7 headers");
            config.validations.headersResetTime(info.resetTime);
            setDraft7Headers(response, info, config.windowMs);
            break;
          }
          case "draft-8": {
            const retrieveName = typeof config.identifier === "function" ? config.identifier(request, response) : config.identifier;
            const name = await retrieveName;
            debug("set ietf draft 8 headers");
            debug("set name to %o", name);
            config.validations.headersResetTime(info.resetTime);
            setDraft8Headers(response, info, config.windowMs, name, key);
            break;
          }
          default: {
            config.validations.headersDraftVersion(config.standardHeaders);
            break;
          }
        }
      }
      if (config.skipFailedRequests || config.skipSuccessfulRequests) {
        let decremented = false;
        const decrementKey = async () => {
          if (!decremented) {
            if (resetTime && Date.now() >= resetTime.getTime()) {
              return;
            }
            debug("decrementing count");
            await config.store.decrement(key);
            decremented = true;
          }
        };
        if (config.skipFailedRequests) {
          if (finishPromise) {
            void finishPromise.then(async () => {
              const success = await config.requestWasSuccessful(
                request,
                response
              );
              debug("computed requestWasSuccessful as %o", success);
              if (!success) await decrementKey();
            });
          }
          if (closePromise) {
            void closePromise.then(async () => {
              if (!response.writableEnded) await decrementKey();
            });
          }
          if (errorPromise) {
            void errorPromise.then(async () => {
              await decrementKey();
            });
          }
        }
        if (config.skipSuccessfulRequests) {
          if (finishPromise) {
            void finishPromise.then(async () => {
              const success = await config.requestWasSuccessful(
                request,
                response
              );
              debug("computed requestWasSuccessful as %o", success);
              if (success) await decrementKey();
            });
          }
        }
      }
      if (totalHits > limit) {
        debug("limit exceeded");
        if (config.legacyHeaders || config.standardHeaders) {
          debug("set retry-after header");
          const retrieveRetryAfter = typeof config.retryAfter === "function" ? config.retryAfter(request, response) : config.retryAfter;
          const retryAfter = await retrieveRetryAfter;
          setRetryAfterHeader(response, info, config.windowMs, retryAfter);
        }
        config.handler(request, response, next, options);
        return;
      }
      next();
    }
  );
  const getThrowFn = () => {
    throw new Error("The current store does not support the get/getKey method");
  };
  middleware.resetKey = config.store.resetKey.bind(config.store);
  middleware.getKey = typeof config.store.get === "function" ? config.store.get.bind(config.store) : getThrowFn;
  return middleware;
};
var rate_limit_default = rateLimit;
var SECOND = 1e3;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;

// server/rate-limit.ts
import crypto from "node:crypto";
function ipKey(req) {
  return req.ip || req.socket.remoteAddress || "unknown";
}
function ipAuthKey(req) {
  const auth = req.headers.authorization ?? "";
  if (!auth.startsWith("Bearer ")) return ipKey(req);
  const digest = crypto.createHash("sha1").update(auth).digest("hex").slice(0, 16);
  return `${ipKey(req)}:${digest}`;
}
var base = {
  standardHeaders: true,
  // send RateLimit-* headers
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many requests. Please slow down and try again later."
    });
  }
};
var apiLimiter = rate_limit_default({
  ...base,
  windowMs: 15 * 6e4,
  limit: 600,
  keyGenerator: ipKey
});
var eventsLimiter = rate_limit_default({
  ...base,
  windowMs: 15 * 6e4,
  limit: 240,
  keyGenerator: ipKey
});
var questionsLimiter = rate_limit_default({
  ...base,
  windowMs: 15 * 6e4,
  limit: 300,
  keyGenerator: ipKey
});
var uploadLimiter = rate_limit_default({
  ...base,
  windowMs: 15 * 6e4,
  limit: 60,
  keyGenerator: ipAuthKey
});
var paymentsLimiter = rate_limit_default({
  ...base,
  windowMs: 15 * 6e4,
  limit: 30,
  keyGenerator: ipAuthKey
});
var aiLimiter = rate_limit_default({
  ...base,
  windowMs: 60 * 6e4,
  limit: 20,
  keyGenerator: ipAuthKey
});
var writeLimiter = rate_limit_default({
  ...base,
  windowMs: 15 * 6e4,
  limit: 30,
  keyGenerator: ipAuthKey
});
var voteLimiter = rate_limit_default({
  ...base,
  windowMs: 15 * 6e4,
  limit: 60,
  keyGenerator: ipAuthKey
});

// server/routes/feedback.ts
init_middleware();
var feedbackRouter = Router4();
feedbackRouter.get("/", async (req, res) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const supabase = createServerSupabase();
    let query = supabase.from("feedback_items").select("id, title, description, category, status, user_id, created_at").order("created_at", { ascending: false }).limit(200);
    if (category) query = query.eq("category", category);
    const { data: items, error } = await query;
    if (error) throw error;
    const rows2 = items ?? [];
    if (rows2.length === 0) {
      res.json({ items: [] });
      return;
    }
    const ids = rows2.map((r) => r.id);
    const { data: votes, error: votesError } = await supabase.from("feedback_votes").select("item_id, user_id").in("item_id", ids);
    if (votesError) throw votesError;
    const counts = /* @__PURE__ */ new Map();
    const voterIds = /* @__PURE__ */ new Set();
    for (const v of votes ?? []) {
      counts.set(v.item_id, (counts.get(v.item_id) ?? 0) + 1);
      voterIds.add(v.user_id);
    }
    let myVotes = /* @__PURE__ */ new Set();
    const { getUserFromRequest: getUserFromRequest2, getBearerToken: getBearerToken2 } = await Promise.resolve().then(() => (init_middleware(), middleware_exports));
    if (getBearerToken2(req)) {
      const user = await getUserFromRequest2(req);
      if (user && voterIds.size > 0) {
        const { data: mine } = await supabase.from("feedback_votes").select("item_id").eq("user_id", user.id).in("item_id", ids);
        myVotes = new Set((mine ?? []).map((v) => v.item_id));
      }
    }
    const itemsWithVotes = rows2.map((item) => ({
      ...item,
      votes: counts.get(item.id) ?? 0,
      myVote: myVotes.has(item.id)
    }));
    itemsWithVotes.sort((a, b) => b.votes - a.votes);
    res.json({ items: itemsWithVotes });
  } catch (error) {
    console.error("Error loading feedback:", error);
    res.status(500).json({ error: "Failed to load feedback" });
  }
});
feedbackRouter.post("/", requireAuth, writeLimiter, async (req, res) => {
  try {
    const { title, description, category } = req.body ?? {};
    const user = res.locals.user;
    if (!title || typeof title !== "string" || title.trim().length < 5 || title.length > 160) {
      res.status(400).json({ error: "Title must be between 5 and 160 characters" });
      return;
    }
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("feedback_items").insert({
      title: title.trim(),
      description: typeof description === "string" && description.trim() ? description.trim().slice(0, 2e3) : null,
      category: typeof category === "string" && category.trim() ? category.trim().slice(0, 50) : "General",
      user_id: user.id
    }).select("id, title, description, category, status, user_id, created_at").single();
    if (error) throw error;
    res.status(201).json({ item: { ...data, votes: 0, myVote: false } });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ error: error.message || "Failed to create feedback" });
  }
});
feedbackRouter.post("/:id/vote", requireAuth, voteLimiter, async (req, res) => {
  try {
    const id = String(req.params.id);
    const user = res.locals.user;
    const supabase = createServerSupabase();
    const { data: existing } = await supabase.from("feedback_votes").select("item_id").eq("item_id", id).eq("user_id", user.id).maybeSingle();
    let voted;
    if (existing) {
      await supabase.from("feedback_votes").delete().eq("item_id", id).eq("user_id", user.id);
      voted = false;
    } else {
      await supabase.from("feedback_votes").insert({ item_id: id, user_id: user.id });
      voted = true;
    }
    const { count } = await supabase.from("feedback_votes").select("item_id", { count: "exact", head: true }).eq("item_id", id);
    res.json({ voted, votes: count ?? 0 });
  } catch (error) {
    console.error("Error toggling feedback vote:", error);
    res.status(500).json({ error: "Failed to update vote" });
  }
});

// server/http-hardening.ts
var isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
function setTrustProxy(app2) {
  if (isProd) app2.set("trust proxy", 1);
}
function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  if (isProd) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}
function jsonErrorHandler(err, _req, res, _next) {
  if (res.headersSent) return;
  if (err && err.type === "entity.too.large") {
    res.status(413).json({ error: "Request body too large" });
    return;
  }
  if (err && err.name === "MulterError") {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File exceeds the 10 MB size limit" : err.code === "LIMIT_FILE_COUNT" ? "Too many files (maximum of 10)" : "Upload failed";
    res.status(400).json({ error: message });
    return;
  }
  console.error("Unhandled server error:", err);
  res.status(err && typeof err.status === "number" ? err.status : 500).json({
    error: "Internal server error"
  });
}

// server/routes/forum.ts
init_supabase_server();
init_middleware();
import { Router as Router5 } from "express";
var forumRouter = Router5();
var CATEGORIES = [
  "General Discussions",
  "Course Help",
  "Past Questions Requests",
  "Study Tips",
  "Faculty Groups",
  "University-Specific Threads"
];
function isValidCategory(cat) {
  return CATEGORIES.includes(cat);
}
forumRouter.get("/", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { university, course, category } = req.query;
    let query = supabase.from("forum_posts").select("id, user_id, title, description, category, university, course, created_at").order("created_at", { ascending: false }).limit(100);
    if (typeof university === "string" && university) query = query.eq("university", university);
    if (typeof course === "string" && course) query = query.eq("course", course);
    if (typeof category === "string" && category && isValidCategory(category)) query = query.eq("category", category);
    const { data: rows2, error } = await query;
    if (error) throw error;
    const posts = rows2 ?? [];
    if (posts.length === 0) {
      res.json({ posts: [] });
      return;
    }
    const ids = posts.map((p) => p.id);
    const [votesRes, repliesRes] = await Promise.all([
      supabase.from("forum_votes").select("post_id, user_id").in("post_id", ids),
      supabase.from("forum_replies").select("post_id").in("post_id", ids)
    ]);
    if (votesRes.error) throw votesRes.error;
    if (repliesRes.error) throw repliesRes.error;
    const voteCounts = /* @__PURE__ */ new Map();
    for (const v of votesRes.data ?? []) {
      voteCounts.set(v.post_id, (voteCounts.get(v.post_id) ?? 0) + 1);
    }
    const replyCounts = /* @__PURE__ */ new Map();
    for (const r of repliesRes.data ?? []) {
      replyCounts.set(r.post_id, (replyCounts.get(r.post_id) ?? 0) + 1);
    }
    const authorIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];
    const names = /* @__PURE__ */ new Map();
    if (authorIds.length) {
      const { data: profiles } = await supabase.from("user_profiles").select("id, name").in("id", authorIds);
      for (const prof of profiles ?? []) {
        if (prof.name) names.set(prof.id, prof.name);
      }
    }
    const myVoted = /* @__PURE__ */ new Set();
    if (getBearerToken(req)) {
      const user = await getUserFromRequest(req);
      if (user) {
        const { data: mine } = await supabase.from("forum_votes").select("post_id").eq("user_id", user.id).in("post_id", ids);
        for (const m of mine ?? []) myVoted.add(m.post_id);
      }
    }
    res.json({
      posts: posts.map((p) => ({
        ...p,
        author: p.user_id ? names.get(p.user_id) ?? "Student" : "Anonymous",
        votes: voteCounts.get(p.id) ?? 0,
        replies: replyCounts.get(p.id) ?? 0,
        myVote: myVoted.has(p.id)
      }))
    });
  } catch (error) {
    console.error("Error listing forum posts:", error);
    res.status(500).json({ error: "Failed to load forum posts" });
  }
});
forumRouter.post("/", requireAuth, writeLimiter, async (req, res) => {
  try {
    const { title, description, category, university, course } = req.body ?? {};
    const user = res.locals.user;
    if (!title || typeof title !== "string" || title.trim().length < 5 || title.length > 200) {
      res.status(400).json({ error: "Title must be between 5 and 200 characters" });
      return;
    }
    const bodyText = typeof description === "string" ? description.trim() : "";
    if (bodyText.length > 5e3) {
      res.status(400).json({ error: "Description must be at most 5000 characters" });
      return;
    }
    const cat = typeof category === "string" && isValidCategory(category) ? category : "General Discussions";
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("forum_posts").insert({
      user_id: user.id,
      title: title.trim(),
      description: bodyText,
      category: cat,
      university: typeof university === "string" && university.trim() ? university.trim().slice(0, 120) : null,
      course: typeof course === "string" && course.trim() ? course.trim().slice(0, 120) : null
    }).select("id, user_id, title, description, category, university, course, created_at").single();
    if (error) throw error;
    res.status(201).json({ post: { ...data, author: "Student", votes: 0, replies: 0, myVote: false } });
  } catch (error) {
    console.error("Error creating forum post:", error);
    res.status(500).json({ error: "Failed to create forum post" });
  }
});
forumRouter.post("/:id/vote", requireAuth, voteLimiter, async (req, res) => {
  try {
    const id = String(req.params.id);
    const user = res.locals.user;
    const supabase = createServerSupabase();
    const { data: existing } = await supabase.from("forum_votes").select("post_id").eq("post_id", id).eq("user_id", user.id).maybeSingle();
    let voted;
    if (existing) {
      await supabase.from("forum_votes").delete().eq("post_id", id).eq("user_id", user.id);
      voted = false;
    } else {
      await supabase.from("forum_votes").insert({ post_id: id, user_id: user.id });
      voted = true;
    }
    const { count } = await supabase.from("forum_votes").select("post_id", { count: "exact", head: true }).eq("post_id", id);
    res.json({ voted, votes: count ?? 0 });
  } catch (error) {
    console.error("Error toggling forum vote:", error);
    res.status(500).json({ error: "Failed to update vote" });
  }
});
forumRouter.get("/:id/replies", async (req, res) => {
  try {
    const id = String(req.params.id);
    const supabase = createServerSupabase();
    const { data: rows2, error } = await supabase.from("forum_replies").select("id, post_id, user_id, body, created_at").eq("post_id", id).order("created_at", { ascending: true }).limit(200);
    if (error) throw error;
    const replies = rows2 ?? [];
    const authorIds = [...new Set(replies.map((r) => r.user_id).filter(Boolean))];
    const names = /* @__PURE__ */ new Map();
    if (authorIds.length) {
      const { data: profiles } = await supabase.from("user_profiles").select("id, name").in("id", authorIds);
      for (const prof of profiles ?? []) {
        if (prof.name) names.set(prof.id, prof.name);
      }
    }
    res.json({
      replies: replies.map((r) => ({
        ...r,
        author: r.user_id ? names.get(r.user_id) ?? "Student" : "Anonymous"
      }))
    });
  } catch (error) {
    console.error("Error listing forum replies:", error);
    res.status(500).json({ error: "Failed to load replies" });
  }
});
forumRouter.post("/:id/replies", requireAuth, writeLimiter, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { body } = req.body ?? {};
    const user = res.locals.user;
    if (!body || typeof body !== "string" || body.trim().length < 1 || body.length > 2e3) {
      res.status(400).json({ error: "Reply must be between 1 and 2000 characters" });
      return;
    }
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("forum_replies").insert({ post_id: id, user_id: user.id, body: body.trim() }).select("id, post_id, user_id, body, created_at").single();
    if (error) throw error;
    res.status(201).json({ reply: { ...data, author: "Student" } });
  } catch (error) {
    console.error("Error creating forum reply:", error);
    res.status(500).json({ error: "Failed to create reply" });
  }
});

// server/routes/upload.ts
init_middleware();
import { Router as Router6 } from "express";
import multer from "multer";

// src/lib/upload.ts
init_supabase_server();

// src/lib/ocr.ts
init_genkit();
function mockFallbackAllowed() {
  return process.env.ALLOW_MOCK_OCR === "true" || process.env.NODE_ENV !== "production";
}
function mockBlocked() {
  throw new Error("OCR failed: Gemini Vision could not extract text and mock OCR is disabled in production");
}
async function mockExtractTextFromFile(file) {
  await new Promise((resolve) => setTimeout(resolve, 1e3));
  const ext = file.name.split(".").pop()?.toLowerCase();
  let mockText = "";
  if (ext === "pdf") {
    mockText = `[MOCK OCR] Extracted text from PDF: ${file.name}

University of Lagos
Department of Computer Science
CSC 301 - Data Structures and Algorithms
2023/2024 Academic Session
First Semester Examination

Instruction: Answer ALL questions

Question 1 (20 marks)
(a) Define a binary search tree and explain its properties.
(b) Write an algorithm to insert a node into a BST.
(c) What is the time complexity of search operation in a BST?

Question 2 (20 marks)
(a) Explain the difference between BFS and DFS traversal.
(b) Apply DFS to the following graph starting from vertex A.
(c) What are the applications of BFS in real-world scenarios?`;
  } else if (ext === "jpg" || ext === "jpeg" || ext === "png") {
    mockText = `[MOCK OCR] Extracted text from image: ${file.name}

University of Lagos
Department of Computer Science
CSC 301 - Data Structures
2023 First Semester

Question 1: What is a binary search tree?
Question 2: Explain BFS vs DFS`;
  } else {
    mockText = `Unsupported file type for OCR: ${ext}. Please upload PDF or image files.`;
  }
  return {
    text: mockText,
    confidence: { overall: 0.85, institution: 0.9, course: 0.8, year: 0.95, semester: 0.9, type: 0.85 }
  };
}
async function fileToBase64(file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}
async function geminiExtractText(file, base64, mimeType) {
  console.log(`Attempting Gemini Vision OCR for: ${file.name} (${mimeType}, ${Math.round(base64.length * 0.75 / 1024)}KB)`);
  const startTime = Date.now();
  const response = await ai.generate({
    prompt: [
      {
        text: `Extract ALL text from this academic exam paper image. Read every word carefully and transcribe it exactly as it appears.

Rules:
- Transcribe text faithfully \u2014 do not guess, fabricate, or summarize
- Preserve the original formatting and structure (headings, numbered questions, sub-questions)
- Include ALL visible text: institution name, course details, instructions, questions, and any other content
- For Nigerian universities, recognize common abbreviations: UNILAG, UI, OAU, FUTO, ABU, BUK, UNN, OOU, etc.
- Course codes typically follow patterns like CSC/MTH/PHY/CHM/STA + 3 digits
- If text is unclear or partially visible, include what you can read and note uncertainty

Return ONLY the extracted text, nothing else.`
      },
      {
        media: {
          url: `data:${mimeType};base64,${base64}`
        }
      }
    ]
  });
  const elapsed = Date.now() - startTime;
  console.log(`Gemini Vision OCR completed in ${elapsed}ms`);
  const extractedText = response.text;
  if (!extractedText || extractedText.trim().length < 10) {
    throw new Error("Gemini Vision returned empty or very short text");
  }
  console.log(`Gemini Vision extracted ${extractedText.length} characters`);
  return {
    text: extractedText,
    confidence: {
      overall: 0.95,
      institution: 0.92,
      course: 0.9,
      year: 0.93,
      semester: 0.91,
      type: 0.88
    }
  };
}
async function extractTextFromFile(file) {
  try {
    console.log(`Starting Gemini Vision OCR for: ${file.name}`);
    const base64 = await fileToBase64(file);
    const mimeType = file.type || "application/octet-stream";
    const result = await geminiExtractText(file, base64, mimeType);
    console.log(`OCR successful for: ${file.name} (${result.text.length} chars)`);
    return result;
  } catch (error) {
    console.warn(`Gemini Vision OCR failed for ${file.name}:`, error instanceof Error ? error.message : error);
    if (!mockFallbackAllowed()) mockBlocked();
  }
  console.log(`Using mock OCR for: ${file.name} \u2014 dev fallback only`);
  return mockExtractTextFromFile(file);
}

// src/lib/upload.ts
init_process_uploaded_question();
import { v4 as uuidv42 } from "uuid";
var SAFE_EXT = /^[a-z0-9]{1,10}$/i;
function storagePath(uploaderId, originalName) {
  const ext = (originalName.split(".").pop() ?? "").trim();
  const safeExt = SAFE_EXT.test(ext) ? `.${ext.toLowerCase()}` : "";
  return `${uploaderId}/${uuidv42()}${safeExt}`;
}
async function processLinkImport(fileUrl, uploaderId, _metadata = {}) {
  const supabase = createServerSupabase();
  const { v4: uuidv43 } = await import("uuid");
  const uploadRecord = {
    id: uuidv43(),
    uploader_id: uploaderId,
    file_name: `link-import-${Date.now()}.pdf`,
    file_url: fileUrl,
    file_type: "link-import",
    file_size: 0,
    upload_status: "processing",
    ocr_text: null,
    ocr_confidence: null,
    uploaded_at: (/* @__PURE__ */ new Date()).toISOString(),
    processed_at: null
  };
  const { data: uploadRecordData, error: insertError } = await supabase.from("question_uploads").insert([uploadRecord]).select().single();
  if (insertError) {
    throw new Error(`Failed to save upload record: ${insertError.message}`);
  }
  processLinkImportAsync(uploadRecordData.id, fileUrl, uploaderId, _metadata).catch((err) => {
    console.error("Link import processing failed:", err);
  });
  return {
    upload: uploadRecordData,
    ocrText: null,
    ocrConfidence: null,
    fileUrl
  };
}
async function processLinkImportAsync(uploadId, fileUrl, uploaderId, formMetadata) {
  const supabase = createServerSupabase();
  try {
    const { processQuestionDocument: processQuestionDocument2 } = await Promise.resolve().then(() => (init_process_question_document(), process_question_document_exports));
    const result = await processQuestionDocument2({ fileUrl });
    const { error: updateError } = await supabase.from("question_uploads").update({
      upload_status: "processed",
      ocr_text: result.fullContent,
      ocr_confidence: JSON.stringify({ overall: 0.9 }),
      processed_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", uploadId);
    if (updateError) {
      console.error("Failed to update link import record:", updateError);
    }
    const { processUploadedQuestionFlow: processUploadedQuestionFlow2 } = await Promise.resolve().then(() => (init_process_uploaded_question(), process_uploaded_question_exports));
    await processUploadedQuestionFlow2({
      uploadId,
      ocrText: result.fullContent,
      filename: `link-import-${Date.now()}.pdf`,
      uploaderId,
      institution: formMetadata?.institution,
      course: formMetadata?.course,
      courseCode: formMetadata?.courseCode,
      year: formMetadata?.year,
      semester: formMetadata?.semester
    });
    console.log(`Link import ${uploadId} processed successfully`);
  } catch (error) {
    console.error("Link import processing failed:", error);
    await supabase.from("question_uploads").update({
      upload_status: "failed",
      ocr_text: `Link import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      processed_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", uploadId);
  }
}
async function processQuestionUploadMulti(files, uploaderId, metadata = {}) {
  const supabase = createServerSupabase();
  const pageCount = files.length;
  console.log(`Processing ${pageCount}-page upload for user ${uploaderId}`);
  const uploadRecords = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const storageFileName = storagePath(uploaderId, file.name);
    const { error: uploadError } = await supabase.storage.from("question-files").upload(storageFileName, file, {
      contentType: file.type,
      upsert: false
    });
    if (uploadError) {
      for (const rec of uploadRecords) {
        const path = rec.file_url.split("/question-files/")[1];
        if (path) await supabase.storage.from("question-files").remove([path]);
      }
      throw new Error(`Failed to upload page ${i + 1}: ${uploadError.message}`);
    }
    const { data: urlData } = supabase.storage.from("question-files").getPublicUrl(storageFileName);
    const uploadRecord = {
      id: uuidv42(),
      uploader_id: uploaderId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      upload_status: "uploading",
      ocr_text: null,
      ocr_confidence: null,
      uploaded_at: (/* @__PURE__ */ new Date()).toISOString(),
      processed_at: null
    };
    const { data: recordData, error: recordError } = await supabase.from("question_uploads").insert([uploadRecord]).select().single();
    if (recordError) {
      throw new Error(`Failed to save upload record for page ${i + 1}: ${recordError.message}`);
    }
    uploadRecords.push({
      id: recordData.id,
      file_url: urlData.publicUrl,
      file_name: file.name
    });
  }
  const ocrResults = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const currentFile = files[i];
      const currentUpload = uploadRecords[i];
      console.log(`Running OCR on page ${i + 1}/${pageCount} (${currentFile.name})...`);
      const { text, confidence } = await extractTextFromFile(currentFile);
      ocrResults.push({ text, confidence: confidence.overall ?? 0.8, pageIndex: i });
      await supabase.from("question_uploads").update({
        upload_status: "processed",
        ocr_text: text,
        ocr_confidence: JSON.stringify({ overall: confidence.overall }),
        processed_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", currentUpload.id);
      console.log(`OCR completed for page ${i + 1}: ${text.length} chars`);
    } catch (ocrError) {
      console.error(`OCR failed for page ${i + 1} (non-fatal):`, ocrError);
      await supabase.from("question_uploads").update({
        upload_status: "failed",
        ocr_text: `OCR failed: ${ocrError instanceof Error ? ocrError.message : "Unknown error"}`,
        processed_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", uploadRecords[i].id);
    }
  }
  const combinedOcrText = ocrResults.sort((a, b) => a.pageIndex - b.pageIndex).map((r, idx) => `--- PAGE ${idx + 1} ---
${r.text}`).join("\n\n");
  const primaryUpload = uploadRecords[0];
  processUploadedQuestionFlow({
    uploadId: primaryUpload.id,
    ocrText: combinedOcrText,
    filename: files[0].name,
    uploaderId,
    institution: metadata.institution,
    course: metadata.course,
    courseCode: metadata.courseCode,
    year: metadata.year,
    semester: metadata.semester
  }).then(async (result) => {
    if (result.success && result.questionId && pageCount > 1) {
      const allPageUrls = uploadRecords.map((r, idx) => ({
        page: idx + 1,
        url: r.file_url,
        fileName: r.file_name,
        uploadId: r.id
      }));
      const { data: existingQ } = await supabase.from("questions").select("ai_extracted_data").eq("id", result.questionId).single();
      await supabase.from("questions").update({
        ai_extracted_data: {
          ...existingQ?.ai_extracted_data || {},
          page_count: pageCount,
          pages: allPageUrls
        }
      }).eq("id", result.questionId);
      for (let i = 1; i < uploadRecords.length; i++) {
        await supabase.from("question_uploads").update({ question_id: result.questionId }).eq("id", uploadRecords[i].id);
      }
      console.log(`Multi-page question created: ${result.questionId} with ${pageCount} pages`);
    }
  }).catch((err) => console.error("AI extraction failed for multi-page upload:", err));
  return {
    uploadId: primaryUpload.id,
    fileUrl: primaryUpload.file_url,
    pageCount,
    uploadRecords
  };
}
async function getUploadStatus(uploadId, userId) {
  const supabase = createServerSupabase();
  let query = supabase.from("question_uploads").select("*").eq("id", uploadId);
  if (userId) query = query.eq("uploader_id", userId);
  const { data, error } = await query.single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

// server/routes/upload.ts
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    // 10 MB
    files: 10
  }
});
var uploadRouter = Router6();
function sniffMime(file) {
  const head = file.buffer.subarray(0, 12);
  if (head.length === 0) return null;
  if (head[0] === 37 && head[1] === 80 && head[2] === 68 && head[3] === 70) {
    return "application/pdf";
  }
  if (head[0] === 255 && head[1] === 216 && head[2] === 255) {
    return "image/jpeg";
  }
  if (head[0] === 137 && head[1] === 80 && head[2] === 78 && head[3] === 71) {
    return "image/png";
  }
  return null;
}
uploadRouter.post("/", requireAuth, upload.any(), async (req, res) => {
  try {
    const user = res.locals.user;
    const allFiles = req.files ?? [];
    const fileUrl = typeof req.body.fileUrl === "string" ? req.body.fileUrl : void 0;
    const title = typeof req.body.title === "string" ? req.body.title : void 0;
    const institution = typeof req.body.institution === "string" ? req.body.institution : void 0;
    const course = typeof req.body.course === "string" ? req.body.course : void 0;
    const courseCode = typeof req.body.courseCode === "string" ? req.body.courseCode : void 0;
    const yearRaw = typeof req.body.year === "string" ? req.body.year.trim() : void 0;
    const semester = req.body.semester;
    const type = req.body.type;
    const metadata = {
      title,
      institution,
      course: course || void 0,
      courseCode: courseCode || void 0,
      year: yearRaw || void 0,
      semester: semester || void 0,
      type: type || void 0
    };
    if (fileUrl && allFiles.length === 0) {
      const result2 = await processLinkImport(fileUrl, user.id, metadata);
      res.json({
        success: true,
        uploadId: result2.upload.id,
        fileUrl: result2.fileUrl,
        ocrText: result2.ocrText,
        message: "Link imported and processed successfully"
      });
      return;
    }
    if (allFiles.length === 0) {
      res.status(400).json({ error: "No file or link provided" });
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxSize = 10 * 1024 * 1024;
    for (const file of allFiles) {
      if (!allowedTypes.includes(file.mimetype)) {
        res.status(400).json({ error: `Invalid file type for ${file.originalname}. Only PDF and image files are allowed.` });
        return;
      }
      if (file.size > maxSize) {
        res.status(400).json({ error: `File ${file.originalname} exceeds 10 MB limit` });
        return;
      }
      const sniffed = sniffMime(file);
      if (sniffed === null) {
        res.status(400).json({ error: `File ${file.originalname} is empty or is not a valid PDF/JPEG/PNG` });
        return;
      }
      if (sniffed !== file.mimetype) {
        res.status(400).json({ error: `File ${file.originalname} content does not match its declared type` });
        return;
      }
    }
    const nodeFiles = allFiles.map(
      (f) => new File([f.buffer], f.originalname, { type: f.mimetype })
    );
    const result = await processQuestionUploadMulti(nodeFiles, user.id, metadata);
    res.json({
      success: true,
      uploadId: result.uploadId,
      fileUrl: result.fileUrl,
      pageCount: result.pageCount,
      message: result.pageCount > 1 ? `${result.pageCount}-page question paper uploaded and processed successfully` : "File uploaded and processed successfully"
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});
uploadRouter.get("/", requireAuth, async (req, res) => {
  try {
    const uploadId = typeof req.query.id === "string" ? req.query.id : void 0;
    if (!uploadId) {
      res.status(400).json({ error: "Upload ID is required" });
      return;
    }
    const user = res.locals.user;
    const uploadRecord = await getUploadStatus(uploadId, user.id);
    if (!uploadRecord) {
      res.status(404).json({ error: "Upload not found" });
      return;
    }
    res.json({ success: true, upload: uploadRecord });
  } catch (error) {
    console.error("Upload status error:", error);
    res.status(500).json({ error: "Could not load upload status" });
  }
});

// server/routes/payments.ts
import { Router as Router7 } from "express";

// src/lib/paystack.ts
import crypto2 from "node:crypto";
var PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
var PAYSTACK_BASE_URL = "https://api.paystack.co";
async function initializePayment(params) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100,
      // Convert to kobo
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      plan: params.planCode
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack API error: ${response.status} - ${error}`);
  }
  return response.json();
}
async function verifyPayment(reference) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    }
  );
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack API error: ${response.status} - ${error}`);
  }
  return response.json();
}
function generatePaymentReference(userId, tier) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `JP-${tier}-${userId.slice(0, 8)}-${timestamp}-${random}`;
}
function verifyWebhookSignature(body, signature) {
  const hash = crypto2.createHmac("sha512", PAYSTACK_SECRET_KEY || "").update(body).digest("hex");
  return hash === signature;
}

// src/lib/subscription.ts
function getServerEnv(name) {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  return void 0;
}
var SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    description: "Basic access to questions",
    priceNaira: 0,
    durationDays: 0,
    features: [
      "View approved questions",
      "Basic search and filters",
      "Access to 10 questions per day"
    ]
  },
  premium: {
    id: "premium",
    name: "Premium",
    description: "Full access to all features",
    priceNaira: 2e3,
    durationDays: 30,
    paystackPlanCode: getServerEnv("PAYSTACK_PREMIUM_PLAN_CODE"),
    features: [
      "Unlimited question access",
      "Advanced search and filters",
      "Download questions as PDF",
      "AI-powered study recommendations",
      "Bookmark favorite questions",
      "No daily limits"
    ]
  },
  institutional: {
    id: "institutional",
    name: "Institutional",
    description: "For universities and large groups",
    priceNaira: 5e4,
    durationDays: 365,
    paystackPlanCode: getServerEnv("PAYSTACK_INSTITUTIONAL_PLAN_CODE"),
    features: [
      "Everything in Premium",
      "Bulk user accounts (up to 1000)",
      "Admin dashboard for institutions",
      "Custom branding",
      "Priority support",
      "API access",
      "Analytics and reporting"
    ]
  }
};

// server/routes/payments.ts
init_supabase_server();
init_middleware();
var paymentsRouter = Router7();
paymentsRouter.post("/initiate", requireAuth, async (req, res) => {
  try {
    const { tier } = req.body;
    if (!tier || !(tier in SUBSCRIPTION_PLANS)) {
      res.status(400).json({ error: "Invalid subscription tier" });
      return;
    }
    const plan = SUBSCRIPTION_PLANS[tier];
    if (plan.priceNaira === 0) {
      res.status(400).json({ error: "Cannot initiate payment for free tier" });
      return;
    }
    const user = res.locals.user;
    if (!user.email) {
      res.status(400).json({ error: "User email is required for payment" });
      return;
    }
    const supabase = createServerSupabase();
    const reference = generatePaymentReference(user.id, tier);
    await supabase.from("payments").insert({
      id: reference,
      user_id: user.id,
      tier,
      amount_naira: plan.priceNaira,
      status: "pending",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    const appUrl2 = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 9002}`;
    const paystackResponse = await initializePayment({
      email: user.email,
      amount: plan.priceNaira,
      reference,
      callbackUrl: `${appUrl2}/billing?payment=success&ref=${reference}`,
      metadata: {
        user_id: user.id,
        tier,
        plan_name: plan.name
      },
      planCode: plan.paystackPlanCode
    });
    res.json({
      success: true,
      authorization_url: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({ error: "Failed to initiate payment. Please try again." });
  }
});
paymentsRouter.get("/verify", requireAuth, async (req, res) => {
  try {
    const reference = typeof req.query.reference === "string" ? req.query.reference : void 0;
    if (!reference) {
      res.status(400).json({ error: "Reference is required" });
      return;
    }
    const user = res.locals.user;
    const supabase = createServerSupabase();
    const { data: paymentRow } = await supabase.from("payments").select("user_id").eq("id", reference).maybeSingle();
    if (!paymentRow || paymentRow.user_id !== user.id) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    const verification = await verifyPayment(reference);
    if (verification.data.status === "success") {
      await supabase.from("payments").update({
        status: "success",
        paid_at: (/* @__PURE__ */ new Date()).toISOString(),
        paystack_response: verification.data
      }).eq("id", reference);
      const { data: payment } = await supabase.from("payments").select("user_id, tier").eq("id", reference).single();
      if (payment) {
        const expiresAt = /* @__PURE__ */ new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await supabase.from("subscriptions").upsert({
          user_id: payment.user_id,
          tier: payment.tier,
          status: "active",
          payment_reference: reference,
          starts_at: (/* @__PURE__ */ new Date()).toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    res.json({
      success: verification.data.status === "success",
      status: verification.data.status,
      amount: verification.data.amount / 100,
      // Convert from kobo
      reference: verification.data.reference
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});
paymentsRouter.post("/webhook", async (req, res) => {
  try {
    const rawBody = req.body.toString("utf8");
    const signature = req.headers["x-paystack-signature"];
    if (!signature || Array.isArray(signature)) {
      res.status(400).json({ error: "No signature" });
      return;
    }
    if (!verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
    const event = JSON.parse(rawBody);
    const supabase = createServerSupabase();
    switch (event.event) {
      case "charge.success": {
        const { reference } = event.data;
        const verification = await verifyPayment(reference);
        if (verification.data.status !== "success") {
          console.warn(`Payment ${reference} verification failed`);
          break;
        }
        await supabase.from("payments").update({
          status: "success",
          paystack_response: event.data,
          paid_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", reference);
        const { data: payment } = await supabase.from("payments").select("user_id, tier").eq("id", reference).single();
        if (payment) {
          const expiresAt = /* @__PURE__ */ new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          await supabase.from("subscriptions").upsert({
            user_id: payment.user_id,
            tier: payment.tier,
            status: "active",
            payment_reference: reference,
            starts_at: (/* @__PURE__ */ new Date()).toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        break;
      }
      case "subscription.create": {
        console.log("Subscription created:", event.data);
        break;
      }
      case "subscription.disable": {
        const { subscription_code } = event.data;
        await supabase.from("subscriptions").update({ status: "cancelled" }).eq("paystack_subscription_code", subscription_code);
        break;
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// server/routes/users.ts
import { Router as Router8 } from "express";
init_supabase_server();
init_middleware();
var usersRouter = Router8();
var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
usersRouter.get("/:userId/uploads", async (req, res) => {
  const { userId } = req.params;
  try {
    if (!UUID_REGEX.test(userId)) {
      res.json([]);
      return;
    }
    let requesterId = null;
    if (getBearerToken(req)) {
      const user = await getUserFromRequest(req);
      if (user) requesterId = user.id;
    }
    const isOwner = requesterId !== null && requesterId === userId;
    const supabase = createServerSupabase();
    let data = [];
    let error = null;
    if (isOwner) {
      const result = await supabase.from("questions").select("*").eq("uploader_id", userId).order("created_at", { ascending: false });
      data = result.data ?? [];
      error = result.error;
    } else {
      const result = await supabase.from("questions").select(
        "id, title, institution, course, faculty, department, year, semester, type, status, content_preview, file_name, file_type, lecturer_id, created_at, updated_at"
      ).eq("uploader_id", userId).eq("status", "approved").order("created_at", { ascending: false });
      data = result.data ?? [];
      error = result.error;
    }
    if (error) {
      console.error(`Failed to fetch uploads for user ${userId}:`, error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(data.map((row) => mapQuestionRow(row)));
  } catch (error) {
    console.error(`Failed to fetch uploads for user ${userId}:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// server/routes/subscription.ts
init_supabase_server();
init_middleware();
import { Router as Router9 } from "express";
var subscriptionRouter = Router9();
subscriptionRouter.get("/", requireAuth, async (_req, res) => {
  try {
    const user = res.locals.user;
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single();
    if (error && error.code !== "PGRST116") {
      throw error;
    }
    res.json(data || { tier: "free", status: "active" });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// server/routes/ai.ts
init_process_question_document();
init_middleware();
import { Router as Router10 } from "express";
import { z as z4 } from "zod";
var aiRouter = Router10();
function isAllowedSource(fileUrl) {
  if (fileUrl.startsWith("data:image/jpeg") || fileUrl.startsWith("data:image/png") || fileUrl.startsWith("data:application/pdf")) {
    return fileUrl.length <= 2e7;
  }
  try {
    const url = new URL(fileUrl);
    return url.protocol === "https:" && url.hostname === "drive.google.com";
  } catch {
    return false;
  }
}
var ProcessDocumentBody = z4.object({
  fileUrl: z4.string().min(1, "fileUrl is required").max(2e7)
});
aiRouter.post("/process-document", requireAuth, aiLimiter, async (req, res) => {
  try {
    const parsed = ProcessDocumentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" });
      return;
    }
    const { fileUrl } = parsed.data;
    if (!isAllowedSource(fileUrl)) {
      res.status(400).json({ error: "Only Google Drive links or pasted image data are supported" });
      return;
    }
    const result = await processQuestionDocument({ fileUrl });
    res.json(result);
  } catch (error) {
    console.error("AI document processing error:", error);
    res.status(500).json({ error: "Document processing failed" });
  }
});

// server/routes/lecturers.ts
init_middleware();
init_supabase_server();
import { Router as Router11 } from "express";
var lecturersRouter = Router11();
lecturersRouter.get("/", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { institution, q } = req.query;
    let query = supabase.from("lecturers").select("*").order("rating_avg", { ascending: false });
    if (typeof institution === "string" && institution) {
      query = query.eq("institution", institution);
    }
    if (typeof q === "string" && q) {
      query = query.or(`name.ilike.%${q}%,department.ilike.%${q}%`);
    }
    const { data, error } = await query.limit(50);
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error("Error listing lecturers:", error);
    res.status(500).json({ error: "Failed to fetch lecturers" });
  }
});
lecturersRouter.get("/:id", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;
    const { data, error } = await supabase.from("lecturers").select("*").eq("id", id).single();
    if (error && error.code === "PGRST116") {
      res.status(404).json({ error: "Lecturer not found" });
      return;
    }
    if (error) throw error;
    const { data: courses } = await supabase.from("questions").select("course, institution").eq("lecturer_id", id).eq("status", "approved");
    const uniqueCourses = [...new Set((courses ?? []).map((c) => c.course))];
    const uniqueInstitutions = [...new Set((courses ?? []).map((c) => c.institution))];
    res.json({
      ...data,
      courses: uniqueCourses,
      institutions: uniqueInstitutions,
      questionCount: courses?.length ?? 0
    });
  } catch (error) {
    console.error("Error fetching lecturer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
lecturersRouter.post("/", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { name, institution, faculty, department, country, photo_url, teaching_style, known_for } = req.body;
    if (!name || !institution) {
      res.status(400).json({ error: "name and institution are required" });
      return;
    }
    const { data, error } = await supabase.from("lecturers").insert([{
      name,
      institution,
      faculty: faculty || null,
      department: department || null,
      country: country || null,
      photo_url: photo_url || null,
      teaching_style: teaching_style || [],
      known_for: known_for || ""
    }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error("Error creating lecturer:", error);
    res.status(500).json({ error: error.message || "Failed to create lecturer" });
  }
});
lecturersRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;
    const { name, institution, faculty, department, country, photo_url, teaching_style, known_for } = req.body;
    const updates = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    if (name !== void 0) updates.name = name;
    if (institution !== void 0) updates.institution = institution;
    if (faculty !== void 0) updates.faculty = faculty;
    if (department !== void 0) updates.department = department;
    if (country !== void 0) updates.country = country;
    if (photo_url !== void 0) updates.photo_url = photo_url;
    if (teaching_style !== void 0) updates.teaching_style = teaching_style;
    if (known_for !== void 0) updates.known_for = known_for;
    const { data, error } = await supabase.from("lecturers").update(updates).eq("id", id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error updating lecturer:", error);
    res.status(500).json({ error: error.message || "Failed to update lecturer" });
  }
});
lecturersRouter.get("/:id/questions", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;
    const { data, error } = await supabase.from("questions").select("*").eq("lecturer_id", id).eq("status", "approved").order("year", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error("Error fetching lecturer questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// server/routes/lecturer-reviews.ts
init_middleware();
init_supabase_server();
import { Router as Router12 } from "express";
var lecturerReviewsRouter = Router12();
lecturerReviewsRouter.get("/lecturer/:lecturerId", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { lecturerId } = req.params;
    const { data, error } = await supabase.from("lecturer_reviews").select("*, user_profiles:user_id(name, avatar)").eq("lecturer_id", lecturerId).order("upvotes", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error("Error listing reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});
lecturerReviewsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user;
    const { lecturer_id, rating, relationship, review_text, is_anonymous } = req.body;
    if (!lecturer_id || !rating) {
      res.status(400).json({ error: "lecturer_id and rating are required" });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: "rating must be between 1 and 5" });
      return;
    }
    const { data, error } = await supabase.from("lecturer_reviews").upsert({
      lecturer_id,
      user_id: user.id,
      rating,
      relationship: relationship || "student",
      review_text: review_text || "",
      is_anonymous: is_anonymous || false
    }, { onConflict: "lecturer_id,user_id" }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error("Error saving review:", error);
    res.status(500).json({ error: error.message || "Failed to save review" });
  }
});
lecturerReviewsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user;
    const { id } = req.params;
    const { error } = await supabase.from("lecturer_reviews").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});
lecturerReviewsRouter.post("/:id/vote", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user;
    const { id } = req.params;
    const { value } = req.body;
    if (value !== 1 && value !== -1) {
      res.status(400).json({ error: "value must be 1 or -1" });
      return;
    }
    const { error } = await supabase.rpc("vote_on_review", {
      p_review_id: id,
      p_user_id: user.id,
      p_value: value
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ error: error.message || "Failed to vote" });
  }
});

// server/routes/lecturer-flags.ts
init_middleware();
init_supabase_server();
import { Router as Router13 } from "express";
var lecturerFlagsRouter = Router13();
lecturerFlagsRouter.get("/", requireAdmin, async (_req, res) => {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("lecturer_flags").select("*, reporter:reporter_id(name)").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error("Error listing flags:", error);
    res.status(500).json({ error: "Failed to fetch flags" });
  }
});
lecturerFlagsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user;
    const { target_type, target_id, reason } = req.body;
    if (!target_type || !target_id) {
      res.status(400).json({ error: "target_type and target_id are required" });
      return;
    }
    if (!["lecturer", "review", "photo"].includes(target_type)) {
      res.status(400).json({ error: "target_type must be lecturer, review, or photo" });
      return;
    }
    const { data, error } = await supabase.from("lecturer_flags").insert([{
      target_type,
      target_id,
      reporter_id: user.id,
      reason: reason || ""
    }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error("Error creating flag:", error);
    res.status(500).json({ error: error.message || "Failed to create flag" });
  }
});
lecturerFlagsRouter.patch("/:id/resolve", requireAdmin, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;
    const { status, admin_note } = req.body;
    if (!["resolved", "dismissed"].includes(status)) {
      res.status(400).json({ error: "status must be resolved or dismissed" });
      return;
    }
    const { data, error } = await supabase.from("lecturer_flags").update({ status, admin_note: admin_note || null }).eq("id", id).select().single();
    if (error) throw error;
    if (status === "resolved") {
      const flag = data;
      if (flag.target_type === "review") {
        await supabase.from("lecturer_reviews").delete().eq("id", flag.target_id);
      } else if (flag.target_type === "photo") {
        await supabase.from("lecturer_photos").delete().eq("id", flag.target_id);
      }
    }
    res.json(data);
  } catch (error) {
    console.error("Error resolving flag:", error);
    res.status(500).json({ error: error.message || "Failed to resolve flag" });
  }
});

// server/routes/lecturer-photos.ts
init_middleware();
init_supabase_server();
import { Router as Router14 } from "express";
import multer2 from "multer";
var upload2 = multer2({
  storage: multer2.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
  // 5 MB
});
var lecturerPhotosRouter = Router14();
lecturerPhotosRouter.get("/lecturer/:lecturerId", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { lecturerId } = req.params;
    const { data, error } = await supabase.from("lecturer_photos").select("*, user:user_id(name, avatar)").eq("lecturer_id", lecturerId).order("is_primary", { ascending: false }).order("upvotes", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error("Error listing photos:", error);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});
lecturerPhotosRouter.post(
  "/",
  requireAuth,
  upload2.single("photo"),
  async (req, res) => {
    try {
      const supabase = createServerSupabase();
      const user = res.locals.user;
      const { lecturer_id, caption, photo_url } = req.body;
      if (!lecturer_id) {
        res.status(400).json({ error: "lecturer_id is required" });
        return;
      }
      let finalUrl = photo_url;
      if (req.file && !photo_url) {
        const ext = req.file.originalname.split(".").pop() || "jpg";
        const storagePath2 = `lecturer-photos/${lecturer_id}/${user.id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("question-files").upload(storagePath2, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("question-files").getPublicUrl(storagePath2);
        finalUrl = urlData.publicUrl;
      }
      if (!finalUrl) {
        res.status(400).json({ error: "Either photo file or photo_url is required" });
        return;
      }
      const { data, error } = await supabase.from("lecturer_photos").insert([{
        lecturer_id,
        user_id: user.id,
        photo_url: finalUrl,
        caption: caption || ""
      }]).select().single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ error: error.message || "Failed to upload photo" });
    }
  }
);
lecturerPhotosRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user;
    const { id } = req.params;
    const { error } = await supabase.from("lecturer_photos").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({ error: "Failed to delete photo" });
  }
});
lecturerPhotosRouter.post("/:id/upvote", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;
    const { error } = await supabase.rpc("increment_photo_upvotes", { photo_id: id });
    if (error) {
      const { data: photo } = await supabase.from("lecturer_photos").select("upvotes").eq("id", id).single();
      if (photo) {
        await supabase.from("lecturer_photos").update({ upvotes: (photo.upvotes || 0) + 1 }).eq("id", id);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error upvoting photo:", error);
    res.status(500).json({ error: "Failed to upvote photo" });
  }
});

// server/routes/cron.ts
init_supabase_server();
import { Router as Router15 } from "express";

// src/lib/digest-email.ts
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function fmtDuration(seconds) {
  if (!seconds) return "\u2014";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}
function eventLabel(event) {
  return event.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function stat(label, value) {
  return `<td width="33%" style="padding:6px;"><div style="background:#f8fafc;border-radius:8px;padding:14px;text-align:center;font-family:Arial,sans-serif;">
    <div style="font-size:22px;font-weight:bold;color:#0f172a;">${esc(value)}</div>
    <div style="font-size:11px;color:#64748b;text-transform:uppercase;">${esc(label)}</div>
  </div></td>`;
}
function rows(items) {
  return items.map(
    ([left, right], i) => `<tr><td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:13px;color:#0f172a;">${i + 1}. ${esc(left)}
        <span style="float:right;color:#7c3aed;font-weight:bold;">${esc(right)}</span></td></tr>`
  ).join("");
}
function section(title, body) {
  return `<h3 style="font-size:14px;color:#0f172a;margin:20px 0 8px;font-family:Arial,sans-serif;">${esc(title)}</h3>
  <table width="100%" style="background:#f8fafc;border-radius:8px;border-collapse:collapse;">${body}</table>`;
}
function renderDigestHtml(p) {
  const { overview, topPages, topEvents, funnels } = p.summary;
  const pagesBody = rows(topPages.slice(0, 5).map((x) => [x.page, `${x.views} views`]));
  const eventsBody = rows(topEvents.slice(0, 5).map((x) => [eventLabel(x.event), String(x.count)]));
  const funnelsBody = funnels.map((f) => {
    const steps = f.steps.map((s, i) => {
      const pct = s.conversion === null ? "\u2014" : `${Math.round(s.conversion * 100)}%`;
      const color = s.conversion !== null && s.conversion < 0.5 ? "#dc2626" : "#16a34a";
      return `${i > 0 ? " \u2192 " : ""}${esc(eventLabel(s.event))} <strong style="color:${color}">${pct}</strong>`;
    }).join("");
    return `<tr><td style="padding:8px 12px;font-family:Arial,sans-serif;font-size:13px;color:#334155;"><strong>${esc(f.name)}</strong><br/>${steps}</td></tr>`;
  }).join("");
  return `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
  <div style="background:#7c3aed;border-radius:12px 12px 0 0;padding:20px 24px;">
    <div style="color:#fff;font-size:18px;font-weight:bold;">JackPass Weekly Digest</div>
    <div style="color:#e9d5ff;font-size:13px;margin-top:4px;">${esc(p.rangeStart)} \u2192 ${esc(p.rangeEnd)}</div>
  </div>
  <div style="background:#fff;border-radius:0 0 12px 12px;padding:16px 12px 24px;">
    <table width="100%" style="border-collapse:collapse;"><tr>
      ${stat("Sessions", String(overview.sessions))}${stat("Page Views", String(overview.pageViews))}${stat("Users", String(overview.uniqueUsers))}
    </tr><tr>
      ${stat("Avg Session", fmtDuration(overview.avgSessionDuration))}${stat("Total Events", String(overview.totalEvents))}<td width="33%">&nbsp;</td>
    </tr></table>
    ${topPages.length ? section("Top Pages", pagesBody) : ""}
    ${topEvents.length ? section("Top Features", eventsBody) : ""}
    ${funnels.length ? section("Funnels", funnelsBody) : ""}
    <a href="${esc(p.appUrl)}/admin/analytics" style="display:block;margin:24px auto 0;width:220px;text-align:center;background:#7c3aed;color:#fff;text-decoration:none;font-size:14px;font-weight:bold;padding:11px 0;border-radius:8px;">View full analytics \u2192</a>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;">Weekly usage summary \xB7 JackPass</p>
</div>`;
}
function renderDigestText(p) {
  const o = p.summary.overview;
  const lines = [
    `JackPass Weekly Digest \u2014 ${p.rangeStart} to ${p.rangeEnd}`,
    "",
    `Sessions: ${o.sessions} | Page views: ${o.pageViews} | Users: ${o.uniqueUsers}`,
    `Avg session: ${fmtDuration(o.avgSessionDuration)} | Total events: ${o.totalEvents}`
  ];
  if (p.summary.topPages.length) {
    lines.push("", "Top pages:");
    p.summary.topPages.slice(0, 5).forEach((x, i) => lines.push(`  ${i + 1}. ${x.page} \u2014 ${x.views} views`));
  }
  if (p.summary.topEvents.length) {
    lines.push("", "Top features:");
    p.summary.topEvents.slice(0, 5).forEach((x, i) => lines.push(`  ${i + 1}. ${eventLabel(x.event)} \u2014 ${x.count}`));
  }
  lines.push("", `Full analytics: ${p.appUrl}/admin/analytics`);
  return lines.join("\n");
}

// server/routes/cron.ts
init_middleware();
var RESEND_ENDPOINT = "https://api.resend.com/emails";
function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://jackpass-vite.vercel.app").replace(/\/$/, "");
}
function weekWindow() {
  const end = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const start = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  return { start, end, days: 7 };
}
function subjectFor(start, end) {
  return `JackPass weekly digest \u2014 ${start} to ${end}`;
}
async function sendDigest({ to, start, end, days }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const summary = await buildSummary(createServerSupabase(), days);
  const payload = { summary, rangeStart: start, rangeEnd: end, appUrl: appUrl() };
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.DIGEST_FROM_EMAIL || "JackPass <digest@jackpass.app>",
      to,
      subject: subjectFor(start, end),
      html: renderDigestHtml(payload),
      text: renderDigestText(payload)
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof body === "object" && body !== null ? JSON.stringify(body) : "";
    throw new Error(`Resend failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const id = body?.id ?? "unknown";
  console.log(`Digest email sent to ${to.length} recipient(s), id=${id}, window=${start}..${end}`);
  return id;
}
var cronRouter = Router15();
cronRouter.post("/weekly-digest", async (req, res) => {
  const auth = req.headers.authorization || "";
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const supabase = createServerSupabase();
    const { start, end, days } = weekWindow();
    const weekKey = `${start}_${end}`;
    const { data: existing } = await supabase.from("digest_sends").select("id").eq("week_key", weekKey).maybeSingle();
    if (existing) {
      res.json({ ok: true, skipped: true, reason: "already sent", weekKey });
      return;
    }
    const { data: profiles } = await supabase.from("user_profiles").select("id").eq("is_admin", true);
    const adminIds = (profiles ?? []).map((p) => p.id);
    const to = [];
    const { createClient: createClient3 } = await import("@supabase/supabase-js");
    const admin = createClient3(
      process.env.NEXT_PUBLIC_SUPABASE_URL.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, ""),
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data: usersList } = await admin.auth.admin.listUsers({ perPage: 500 });
    for (const u of usersList?.users ?? []) {
      if (adminIds.includes(u.id) && u.email) to.push(u.email);
    }
    if (to.length === 0) {
      res.json({ ok: true, skipped: true, reason: "no admin recipients" });
      return;
    }
    const resendId = await sendDigest({ to, start, end, days });
    await supabase.from("digest_sends").insert({ week_key: weekKey, recipients: to.length, resend_id: resendId });
    res.json({ ok: true, sent: to.length, weekKey });
  } catch (error) {
    console.error("Weekly digest failed:", error);
    res.status(500).json({ error: "Digest failed" });
  }
});
var adminDigestRouter = Router15();
adminDigestRouter.use(requireAdmin);
adminDigestRouter.post("/send", async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 7));
    const toParam = typeof req.query.to === "string" ? req.query.to.trim() : "";
    const start = new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10);
    const end = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const to = toParam ? [toParam] : [res.locals.user?.email || ""].filter(Boolean);
    if (to.length === 0) {
      res.status(400).json({ error: "No recipient email available" });
      return;
    }
    const resendId = await sendDigest({ to, start, end, days });
    res.json({ ok: true, to, window: { start, end }, resendId });
  } catch (error) {
    console.error("Digest test send failed:", error);
    res.status(500).json({ error: "Digest send failed" });
  }
});

// api/_server.ts
var app = express();
app.disable("x-powered-by");
setTrustProxy(app);
app.use(securityHeaders);
app.use((req, res, next) => {
  if (req.path === "/api/payments/webhook") {
    express.raw({ type: "*/*" })(req, res, next);
  } else {
    express.json({ limit: "25mb" })(req, res, next);
  }
});
app.use("/api", apiLimiter);
app.use("/api/events", eventsLimiter);
app.use("/api/questions", questionsLimiter);
app.use("/api/upload", uploadLimiter);
app.use("/api/payments", paymentsLimiter);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "jackpass-api", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/api/questions", questionsRouter);
app.use("/api/admin", adminBaseRouter);
app.use("/api/admin/questions", adminRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/admin/analytics", adminAnalyticsRouter);
app.use("/api/events", analyticsRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/forum", forumRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/user/subscription", subscriptionRouter);
app.use("/api/ai", aiRouter);
app.use("/api/lecturers", lecturersRouter);
app.use("/api/lecturer-reviews", lecturerReviewsRouter);
app.use("/api/lecturer-flags", lecturerFlagsRouter);
app.use("/api/lecturer-photos", lecturerPhotosRouter);
app.use("/api/cron", cronRouter);
app.use("/api/admin/digest", adminDigestRouter);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});
app.use(jsonErrorHandler);
var server_default = app;
export {
  server_default as default
};
