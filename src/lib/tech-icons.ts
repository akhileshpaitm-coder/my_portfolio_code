import type { ComponentType } from "react";
import type { IconType } from "react-icons";
import {
  SiJavascript, SiTypescript, SiReact, SiNextdotjs, SiNodedotjs, SiExpress,
  SiNestjs, SiSocketdotio, SiPostgresql, SiMongodb, SiSass, SiTailwindcss,
  SiFigma, SiCypress, SiStorybook, SiGit, SiDocker, SiKubernetes, SiJenkins,
  SiApachekafka, SiGraphql, SiPhp, SiLaravel, SiPython, SiMysql, SiFirebase,
  SiTypeorm, SiPrisma, SiVuedotjs, SiHtml5, SiCss, SiJquery, SiGitlab,
  SiSonarqubecloud, SiRedis, SiPostman, SiSwagger, SiIntellijidea,
  // ── newly added ──
  SiAngular, SiSvelte, SiAstro, SiNuxt, SiRemix, SiGatsby, SiVite, SiWebpack,
  SiBabel, SiTurborepo, SiRedux, SiTanstack, SiReactrouter, SiApollographql,
  SiThreedotjs, SiChartdotjs, SiGreensock, SiFramer, SiBootstrap, SiChakraui,
  SiAntdesign, SiMui, SiShadcnui, SiHeadlessui, SiRadixui, SiMaterialdesignicons,
  SiPnpm, SiBun, SiDeno, SiYarn, SiNpm, SiNodemon, SiSanity, SiContentful,
  SiStrapi, SiGhost, SiMarkdown, SiJson, SiYaml, SiFlutter, SiDart, SiKotlin,
  SiSwift, SiGo, SiRust, SiCplusplus, SiDotnet, SiBlazor, SiSymfony,
  SiCodeigniter, SiComposer, SiWordpress, SiShopify, SiWebflow, SiStripe,
  SiPaypal, SiSupabase, SiAppwrite, SiPocketbase, SiMariadb, SiElasticsearch,
  SiDigitalocean, SiGithub, SiOpenapiinitiative, SiSketch, SiInkscape,
  SiBlender, SiUnity, SiUnrealengine, SiGimp, SiAndroid, SiApple, SiElectron,
  SiRabbitmq, SiNginx, SiApache, SiCaddy, SiLinux, SiUbuntu, SiDebian,
  SiAlpinelinux, SiRaspberrypi, SiGooglecloud, SiVercel, SiNetlify,
  SiCloudflare, SiCloudflareworkers, SiFastly, SiAkamai, SiFlydotio, SiRailway,
  SiRender, SiTerraform, SiAnsible, SiGithubactions, SiBitbucket, SiJira,
  SiConfluence, SiTrello, SiNotion, SiDiscord, SiTelegram, SiMailchimp,
  SiMailgun, SiCloudinary, SiMinio, SiGrafana, SiPrometheus, SiDatadog,
  SiSentry, SiSplunk, SiNewrelic, SiAuth0, SiHoppscotch, SiInsomnia, SiBruno,
  SiK6, SiGatling, SiJest, SiVitest, SiMocha, SiChai, SiTestinglibrary,
  SiPuppeteer, SiSelenium, SiPrettier, SiEslint, SiStylelint, SiEditorconfig,
  SiCommitlint, SiSemanticrelease, SiOpentelemetry, SiNumpy, SiPandas,
  SiPytorch, SiTensorflow, SiScikitlearn, SiKeras, SiOpencv, SiLangchain,
  SiOllama, SiHuggingface, SiAnthropic, SiSnowflake, SiDatabricks,
  SiMetabase, SiLooker, SiNatsdotio, SiEtcd, SiJsonwebtokens, SiPassport,
} from "react-icons/si";
import {
  FaSlack, FaAws, FaCss3Alt, FaJava, FaWindows,
} from "react-icons/fa";
import { TbCode, TbLambda, TbRegex, TbApi } from "react-icons/tb";

/**
 * Shared registry of tech brand icons (client + server safe).
 *
 * Used by the Tech Stack section to auto-map technology names to their brand
 * icon/color, and by the admin skill form's icon picker. An explicit icon
 * saved on a skill (see lib/skills.ts) always wins over the auto-map.
 *
 * NOTE: keep this module free of db/server-only imports so client components
 * can use it.
 */

export interface TechIcon {
  icon: IconType | ComponentType<{ className?: string }>;
  color: string;
}

/** Fallback icon for technologies without a known brand mark. */
export const FALLBACK_ICON: TechIcon = {
  icon: TbCode,
  color: "#06b6d4",
};

/**
 * Brand icon + official brand color per technology name. Keys match the
 * names used in the skills data (case-sensitive lookup, like the section's
 * original color map).
 */
export const TECH_ICONS: Record<string, TechIcon> = {
  // ── Languages ──
  "JavaScript": { icon: SiJavascript, color: "#F7DF1E" },
  "TypeScript": { icon: SiTypescript, color: "#3178C6" },
  "Python": { icon: SiPython, color: "#3776AB" },
  "PHP": { icon: SiPhp, color: "#777BB4" },
  "Java": { icon: FaJava, color: "#007396" },
  "Kotlin": { icon: SiKotlin, color: "#7F52FF" },
  "Swift": { icon: SiSwift, color: "#F05138" },
  "Go": { icon: SiGo, color: "#00ADD8" },
  "Rust": { icon: SiRust, color: "#000000" },
  "C++": { icon: SiCplusplus, color: "#00599C" },
  "Dart": { icon: SiDart, color: "#0175C2" },
  ".NET": { icon: SiDotnet, color: "#512BD4" },
  "C": { icon: SiCplusplus, color: "#A8B9CC" },

  // ── Frontend frameworks & libraries ──
  "React.js": { icon: SiReact, color: "#61DAFB" },
  "React": { icon: SiReact, color: "#61DAFB" },
  "React Native": { icon: SiReact, color: "#61DAFB" },
  "Next.js": { icon: SiNextdotjs, color: "#000000" },
  "Vue.js": { icon: SiVuedotjs, color: "#4FC08D" },
  "Nuxt": { icon: SiNuxt, color: "#00DC82" },
  "Angular": { icon: SiAngular, color: "#0F0F11" },
  "Svelte": { icon: SiSvelte, color: "#FF3E00" },
  "Astro": { icon: SiAstro, color: "#BC52EE" },
  "Remix": { icon: SiRemix, color: "#000000" },
  "Gatsby": { icon: SiGatsby, color: "#663399" },
  "HTML5": { icon: SiHtml5, color: "#E34F26" },
  "CSS3": { icon: FaCss3Alt, color: "#1572B6" },
  "Sass/Scss": { icon: SiSass, color: "#CC6699" },
  "Tailwind CSS": { icon: SiTailwindcss, color: "#06B6D4" },
  "Bootstrap": { icon: SiBootstrap, color: "#7952B3" },
  "jQuery": { icon: SiJquery, color: "#0769AD" },
  "Redux": { icon: SiRedux, color: "#764ABC" },
  "TanStack Query": { icon: SiTanstack, color: "#FF4154" },
  "React Router": { icon: SiReactrouter, color: "#CA4245" },
  "Three.js": { icon: SiThreedotjs, color: "#FFFFFF" },
  "GSAP": { icon: SiGreensock, color: "#0AE448" },
  "Framer Motion": { icon: SiFramer, color: "#0099FF" },
  "Material UI": { icon: SiMui, color: "#007FFF" },
  "Chakra UI": { icon: SiChakraui, color: "#3DDC84" },
  "Ant Design": { icon: SiAntdesign, color: "#0170FE" },
  "shadcn/ui": { icon: SiShadcnui, color: "#FFFFFF" },
  "Headless UI": { icon: SiHeadlessui, color: "#66E3FF" },
  "Radix UI": { icon: SiRadixui, color: "#FFFFFF" },
  "Chart.js": { icon: SiChartdotjs, color: "#FF6384" },
  "Socket.io": { icon: SiSocketdotio, color: "#FFFFFF" },

  // ── Backend frameworks & runtimes ──
  "Node.js": { icon: SiNodedotjs, color: "#5FA04E" },
  "Express.js": { icon: SiExpress, color: "#FFFFFF" },
  "NestJS": { icon: SiNestjs, color: "#E0234E" },
  "Laravel": { icon: SiLaravel, color: "#FF2D20" },
  "Symfony": { icon: SiSymfony, color: "#000000" },
  "CodeIgniter": { icon: SiCodeigniter, color: "#EF4B4B" },
  ".NET Core": { icon: SiDotnet, color: "#512BD4" },
  "Blazor": { icon: SiBlazor, color: "#512BD4" },
  "GraphQL": { icon: SiGraphql, color: "#E10098" },
  "Apollo GraphQL": { icon: SiApollographql, color: "#3F20BA" },
  "REST API": { icon: TbApi, color: "#06b6d4" },
  "Kafka": { icon: SiApachekafka, color: "#231F20" },
  "RabbitMQ": { icon: SiRabbitmq, color: "#FF6600" },
  "WebSockets": { icon: SiSocketdotio, color: "#FFFFFF" },

  // ── Databases & ORMs ──
  "MySQL": { icon: SiMysql, color: "#4479A1" },
  "PostgreSQL": { icon: SiPostgresql, color: "#4169E1" },
  "MongoDB": { icon: SiMongodb, color: "#47A248" },
  "MariaDB": { icon: SiMariadb, color: "#003545" },
  "Firebase": { icon: SiFirebase, color: "#DD2C00" },
  "Supabase": { icon: SiSupabase, color: "#3FCF8E" },
  "Appwrite": { icon: SiAppwrite, color: "#FD366E" },
  "PocketBase": { icon: SiPocketbase, color: "#FFFFFF" },
  "Redis": { icon: SiRedis, color: "#FF4438" },
  "Elasticsearch": { icon: SiElasticsearch, color: "#00EBFB" },
  "TypeORM": { icon: SiTypeorm, color: "#FF5D13" },
  "Prisma": { icon: SiPrisma, color: "#2D3748" },
  "Mongoose": { icon: SiMongodb, color: "#8BC34A" },

  // ── DevOps, cloud & hosting ──
  "Docker": { icon: SiDocker, color: "#2496ED" },
  "Kubernetes": { icon: SiKubernetes, color: "#326CE5" },
  "Jenkins": { icon: SiJenkins, color: "#D24939" },
  "SonarQube": { icon: SiSonarqubecloud, color: "#4E9BCD" },
  "Terraform": { icon: SiTerraform, color: "#844FBA" },
  "Ansible": { icon: SiAnsible, color: "#EE0000" },
  "GitHub Actions": { icon: SiGithubactions, color: "#2088FF" },
  "AWS": { icon: FaAws, color: "#FF9900" },
  "Amazon S3": { icon: FaAws, color: "#FF9900" },
  "Google Cloud": { icon: SiGooglecloud, color: "#4285F4" },
  "Azure": { icon: SiDotnet, color: "#0078D4" },
  "Vercel": { icon: SiVercel, color: "#FFFFFF" },
  "Netlify": { icon: SiNetlify, color: "#00C7B7" },
  "Cloudflare": { icon: SiCloudflare, color: "#F38020" },
  "Cloudflare Workers": { icon: SiCloudflareworkers, color: "#F38020" },
  "Fastly": { icon: SiFastly, color: "#FF282D" },
  "Akamai": { icon: SiAkamai, color: "#0096D6" },
  "Fly.io": { icon: SiFlydotio, color: "#24175B" },
  "Railway": { icon: SiRailway, color: "#FFFFFF" },
  "Render": { icon: SiRender, color: "#46E3B7" },
  "DigitalOcean": { icon: SiDigitalocean, color: "#0080FF" },
  "Nginx": { icon: SiNginx, color: "#009639" },
  "Apache": { icon: SiApache, color: "#D22128" },
  "Caddy": { icon: SiCaddy, color: "#65BDA6" },
  "Linux": { icon: SiLinux, color: "#FCC624" },
  "Ubuntu": { icon: SiUbuntu, color: "#E95420" },
  "Debian": { icon: SiDebian, color: "#A81D33" },
  "Alpine Linux": { icon: SiAlpinelinux, color: "#0D597F" },
  "Windows": { icon: FaWindows, color: "#0078D6" },
  "Raspberry Pi": { icon: SiRaspberrypi, color: "#A22846" },
  "AWS Lambda": { icon: TbLambda, color: "#FF9900" },

  // ── Tools, CI/CD & collaboration ──
  "Git": { icon: SiGit, color: "#F05032" },
  "GitLab": { icon: SiGitlab, color: "#FC6D26" },
  "GitHub": { icon: SiGithub, color: "#FFFFFF" },
  "Bitbucket": { icon: SiBitbucket, color: "#0052CC" },
  "Jira": { icon: SiJira, color: "#0052CC" },
  "Confluence": { icon: SiConfluence, color: "#1868DB" },
  "Trello": { icon: SiTrello, color: "#0052CC" },
  "Notion": { icon: SiNotion, color: "#FFFFFF" },
  "Slack": { icon: FaSlack, color: "#4A154B" },
  "Discord": { icon: SiDiscord, color: "#5865F2" },
  "Telegram": { icon: SiTelegram, color: "#26A5E4" },
  "Slack API": { icon: FaSlack, color: "#E01E5A" },
  "npm": { icon: SiNpm, color: "#CB3837" },
  "Yarn": { icon: SiYarn, color: "#2C8EBB" },
  "pnpm": { icon: SiPnpm, color: "#F69220" },
  "Bun": { icon: SiBun, color: "#FBF0DF" },
  "Deno": { icon: SiDeno, color: "#70FFAF" },
  "Webpack": { icon: SiWebpack, color: "#8DD6F9" },
  "Vite": { icon: SiVite, color: "#646CFF" },
  "Babel": { icon: SiBabel, color: "#F9DC3E" },
  "Turborepo": { icon: SiTurborepo, color: "#EF4444" },
  "Nodemon": { icon: SiNodemon, color: "#76D04B" },
  "Composer": { icon: SiComposer, color: "#885630" },

  // ── Testing ──
  "Jest": { icon: SiJest, color: "#C21325" },
  "Vitest": { icon: SiVitest, color: "#6E9F18" },
  "Mocha": { icon: SiMocha, color: "#8D6748" },
  "Chai": { icon: SiChai, color: "#A30701" },
  "Cypress": { icon: SiCypress, color: "#69D3A7" },
  "Playwright": { icon: SiTestinglibrary, color: "#2EAD33" },
  "Testing Library": { icon: SiTestinglibrary, color: "#E33349" },
  "Storybook": { icon: SiStorybook, color: "#FF4785" },
  "Puppeteer": { icon: SiPuppeteer, color: "#00D8A0" },
  "Selenium": { icon: SiSelenium, color: "#43B02A" },
  "k6": { icon: SiK6, color: "#7D64FF" },
  "Gatling": { icon: SiGatling, color: "#FF9E1B" },
  "Postman": { icon: SiPostman, color: "#FF6C37" },
  "Insomnia": { icon: SiInsomnia, color: "#4000BF" },
  "Hoppscotch": { icon: SiHoppscotch, color: "#0C9A78" },
  "Bruno": { icon: SiBruno, color: "#F5C518" },

  // ── Code quality & formatting ──
  "ESLint": { icon: SiEslint, color: "#4B32C3" },
  "Prettier": { icon: SiPrettier, color: "#F7B93E" },
  "Stylelint": { icon: SiStylelint, color: "#263238" },
  "EditorConfig": { icon: SiEditorconfig, color: "#FE0400" },
  "commitlint": { icon: SiCommitlint, color: "#000000" },
  "semantic-release": { icon: SiSemanticrelease, color: "#F9DC3E" },
  "SonarQube Cloud": { icon: SiSonarqubecloud, color: "#4E9BCD" },
  "Swagger": { icon: SiSwagger, color: "#85EA2D" },
  "OpenAPI": { icon: SiOpenapiinitiative, color: "#6BA539" },
  "OpenTelemetry": { icon: SiOpentelemetry, color: "#425CC7" },

  // ── CMS & content ──
  "Sanity": { icon: SiSanity, color: "#F03E2F" },
  "Contentful": { icon: SiContentful, color: "#FAE501" },
  "Strapi": { icon: SiStrapi, color: "#2F2E8B" },
  "Ghost": { icon: SiGhost, color: "#FFFFFF" },
  "WordPress": { icon: SiWordpress, color: "#21759B" },
  "Shopify": { icon: SiShopify, color: "#7AB55C" },
  "Webflow": { icon: SiWebflow, color: "#146EF5" },
  "Markdown": { icon: SiMarkdown, color: "#000000" },
  "JSON": { icon: SiJson, color: "#000000" },
  "YAML": { icon: SiYaml, color: "#CB171E" },
  "Regex": { icon: TbRegex, color: "#06b6d4" },
  "Figma": { icon: SiFigma, color: "#F24E1E" },
  "Sketch": { icon: SiSketch, color: "#F7B500" },
  "Inkscape": { icon: SiInkscape, color: "#000000" },
  "Blender": { icon: SiBlender, color: "#EA7600" },
  "Unity": { icon: SiUnity, color: "#FFFFFF" },
  "Unreal Engine": { icon: SiUnrealengine, color: "#0E1128" },
  "GIMP": { icon: SiGimp, color: "#5C5543" },
  "IntelliJ IDEA": { icon: SiIntellijidea, color: "#000000" },

  // ── Mobile & desktop ──
  "Flutter": { icon: SiFlutter, color: "#02569B" },
  "Android": { icon: SiAndroid, color: "#3DDC84" },
  "iOS": { icon: SiApple, color: "#FFFFFF" },
  "Electron": { icon: SiElectron, color: "#47848F" },

  // ── Observability, auth & data/ML ──
  "Grafana": { icon: SiGrafana, color: "#F46800" },
  "Prometheus": { icon: SiPrometheus, color: "#E6522C" },
  "Datadog": { icon: SiDatadog, color: "#632CA6" },
  "Sentry": { icon: SiSentry, color: "#362D59" },
  "Splunk": { icon: SiSplunk, color: "#000000" },
  "New Relic": { icon: SiNewrelic, color: "#1CE783" },
  "Auth0": { icon: SiAuth0, color: "#EB5424" },
  "JWT": { icon: SiJsonwebtokens, color: "#000000" },
  "Passport.js": { icon: SiPassport, color: "#34E27A" },
  "NATS": { icon: SiNatsdotio, color: "#27AA59" },
  "etcd": { icon: SiEtcd, color: "#419EDA" },
  "NumPy": { icon: SiNumpy, color: "#4DABCF" },
  "Pandas": { icon: SiPandas, color: "#150458" },
  "PyTorch": { icon: SiPytorch, color: "#EE4C2C" },
  "TensorFlow": { icon: SiTensorflow, color: "#FF6F00" },
  "scikit-learn": { icon: SiScikitlearn, color: "#F89939" },
  "Keras": { icon: SiKeras, color: "#D00000" },
  "OpenCV": { icon: SiOpencv, color: "#5C3EE8" },
  "LangChain": { icon: SiLangchain, color: "#1C3C3C" },
  "Ollama": { icon: SiOllama, color: "#FFFFFF" },
  "Hugging Face": { icon: SiHuggingface, color: "#FFD21E" },
  "Anthropic": { icon: SiAnthropic, color: "#D97757" },
  "Snowflake": { icon: SiSnowflake, color: "#29B5E8" },
  "Databricks": { icon: SiDatabricks, color: "#FF3621" },
  "Metabase": { icon: SiMetabase, color: "#509EE3" },
  "Looker": { icon: SiLooker, color: "#5F6CAF" },
  "MinIO": { icon: SiMinio, color: "#C72E49" },
  "Cloudinary": { icon: SiCloudinary, color: "#3448C5" },
  "Mailchimp": { icon: SiMailchimp, color: "#FFE01B" },
  "Mailgun": { icon: SiMailgun, color: "#F06B66" },
  "Stripe": { icon: SiStripe, color: "#635BFF" },
  "PayPal": { icon: SiPaypal, color: "#00457C" },
};

/** Relative luminance (0–1) of a #RRGGBB color. */
export function luminance(hex: string): number {
  const m = hex.replace("#", "");
  if (m.length !== 6) return 1;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** All registry entries, sorted alphabetically — for the admin icon picker. */
export function listTechIcons(): Array<{ name: string } & TechIcon> {
  return Object.entries(TECH_ICONS)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Look up a tech's icon (exact name match), falling back gracefully. */
export function iconForTech(name: string): TechIcon {
  return TECH_ICONS[name] ?? FALLBACK_ICON;
}
