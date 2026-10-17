module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setupEnv.js"],
  testTimeout: 10000, // real DB calls are slower than mocked ones
};
