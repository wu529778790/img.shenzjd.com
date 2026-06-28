import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // 自动将 GITHUB_CLIENT_ID 暴露给客户端
    // 这样只需要配置一个环境变量即可
    NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  },
};

export default nextConfig;
