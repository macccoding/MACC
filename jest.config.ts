import type { Config } from "jest";
import { pathsToModuleNameMapper } from "ts-jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: pathsToModuleNameMapper(
    { "@/*": ["./src/*"] },
    { prefix: "<rootDir>/" }
  ),
};

export default config;
