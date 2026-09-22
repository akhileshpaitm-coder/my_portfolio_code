import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeORM resolves the mongodb driver at runtime via require() — keep both
  // out of the server bundle so that resolution works under Turbopack.
  serverExternalPackages: ["typeorm", "mongodb", "bson"],
};

export default nextConfig;
