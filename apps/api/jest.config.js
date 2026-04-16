/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          target: "ES2022",
          module: "CommonJS",
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          strict: false,
          skipLibCheck: true,
          types: ["jest", "node"],
        },
      },
    ],
  },
  testEnvironment: "node",
  moduleNameMapper: {
    "^@sabong/shared$": "<rootDir>/../../../packages/shared/src/index.ts",
    "^@sabong/shared/(.*)$": "<rootDir>/../../../packages/shared/src/$1",
  },
};
