module.exports = {
  testEnvironment: "node",
  coverageDirectory: "./coverage",
  reporters: ["default", "jest-html-reporters"],
  transformIgnorePatterns: [
    "node_modules/(?!(uuid)/)"
  ],
  moduleNameMapper: {
    "^uuid$": "uuid"
  }
};
