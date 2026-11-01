/**
 * CocoaPods 速查手册 — 纯前端，数据内置
 *
 * CocoaPods 命令与 Podspec/Podfile DSL 速查参考：
 *   - 分类筛选（CLI 命令 / Podspec DSL / Podfile DSL）
 *   - 实时搜索（命令、DSL 方法、参数）
 *   - 命令卡片：语法高亮、参数表格、示例、注意事项
 *   - 一键复制示例命令
 *
 * 类名前缀 cr-，与既有工具同构。
 */
(function () {
  'use strict';

  var ROOT = document.getElementById('cr-app');
  if (!ROOT) return;

  var LANG = (document.documentElement.lang || '').toLowerCase() === 'en' ? 'en' : 'zh';
  var I18N = {
    zh: {
      'search-placeholder': '搜索 pod 命令或 spec 方法…',
      'all-platforms': '全部',
      'commands-count': '条命令',
      'syntax': '语法',
      'options': '常用参数',
      'examples': '示例',
      'notes': '注意事项',
      'related': '相关命令',
      'copy': '复制',
      'copied': '已复制',
      'no-results': '未找到匹配的命令',
      'try-search': '尝试其他关键词或切换分类筛选',
      'platform-cli': 'CLI',
      'platform-dsl': 'Podspec',
      'platform-podfile': 'Podfile',
      'flag': '参数',
      'description': '说明',
      'common': '常用',
    },
    en: {
      'search-placeholder': 'Search pod commands or spec methods…',
      'all-platforms': 'All',
      'commands-count': 'commands',
      'syntax': 'Syntax',
      'options': 'Common Options',
      'examples': 'Examples',
      'notes': 'Notes',
      'related': 'Related',
      'copy': 'Copy',
      'copied': 'Copied',
      'no-results': 'No matching commands found',
      'try-search': 'Try different keywords or change category filter',
      'platform-cli': 'CLI',
      'platform-dsl': 'Podspec',
      'platform-podfile': 'Podfile',
      'flag': 'Flag',
      'description': 'Description',
      'common': 'common',
    }
  };

  function T(key) { return (I18N[LANG] && I18N[LANG][key]) || key; }

  /* ========== 命令数据库 ========== */
  var COMMANDS = [
    /* ─── Pod CLI 命令 ─── */
    {
      name: 'pod init', platforms: ['cli'],
      desc: { zh: '创建 Podfile', en: 'Create a Podfile' },
      syntax: 'pod init [XCODEPROJ]',
      options: [
        { flag: 'XCODEPROJ', desc: { zh: '指定 Xcode 项目文件', en: 'Specify Xcode project file' }, common: false },
      ],
      examples: [
        { cmd: 'pod init', desc: { zh: '为当前目录项目创建 Podfile', en: 'Create Podfile for current directory' } },
      ],
      notes: { zh: '如果指定了 Xcode 项目或当前目录只有一个项目，会自动基于项目 target 生成 Podfile。', en: 'Automatically generates targets based on the project if specified.' },
      related: ['pod install', 'pod setup'],
    },
    {
      name: 'pod install', platforms: ['cli'],
      desc: { zh: '安装依赖', en: 'Install dependencies' },
      syntax: 'pod install [OPTIONS]',
      options: [
        { flag: '--repo-update', desc: { zh: '强制先更新 spec 仓库', en: 'Force repo update before install' }, common: true },
        { flag: '--no-repo-update', desc: { zh: '跳过 spec 仓库更新', en: 'Skip repo update' }, common: true },
        { flag: '--deployment', desc: { zh: '禁止更改 Podfile 或 Podfile.lock', en: 'Disallow changes to Podfile' }, common: false },
        { flag: '--clean-install', desc: { zh: '忽略缓存并强制完整安装', en: 'Ignore cache and force full install' }, common: false },
        { flag: '--project-directory=DIR', desc: { zh: '指定项目根目录', en: 'Project directory path' }, common: false },
      ],
      examples: [
        { cmd: 'pod install', desc: { zh: '安装所有依赖', en: 'Install all dependencies' } },
        { cmd: 'pod install --no-repo-update', desc: { zh: '不更新仓库直接安装', en: 'Install without repo update' } },
      ],
      notes: { zh: '安装后应使用 .xcworkspace 而非 .xcodeproj 打开项目。', en: 'After installation, open .xcworkspace instead of .xcodeproj.' },
      related: ['pod update', 'pod init'],
    },
    {
      name: 'pod update', platforms: ['cli'],
      desc: { zh: '更新 Pod', en: 'Update pods' },
      syntax: 'pod update [POD_NAMES] [OPTIONS]',
      options: [
        { flag: '--repo-update', desc: { zh: '强制先更新 spec 仓库', en: 'Force repo update before update' }, common: true },
        { flag: '--no-repo-update', desc: { zh: '跳过 spec 仓库更新', en: 'Skip repo update' }, common: true },
        { flag: '--deployment', desc: { zh: '禁止更改 Podfile', en: 'Disallow changes to Podfile' }, common: false },
        { flag: '--project-directory=DIR', desc: { zh: '指定项目根目录', en: 'Project directory path' }, common: false },
      ],
      examples: [
        { cmd: 'pod update', desc: { zh: '更新所有 Pod', en: 'Update all pods' } },
        { cmd: 'pod update AFNetworking', desc: { zh: '只更新 AFNetworking', en: 'Update only AFNetworking' } },
      ],
      notes: { zh: '不带参数时更新所有 pod 到允许的最新版本。pod install 只安装不更新。', en: 'Without arguments, updates all pods to the latest allowed version. pod install only installs without updating.' },
      related: ['pod install', 'pod outdated'],
    },
    {
      name: 'pod outdated', platforms: ['cli'],
      desc: { zh: '列出所有可更新的 pod', en: 'List outdated pods' },
      syntax: 'pod outdated [OPTIONS]',
      options: [
        { flag: '--repo-update', desc: { zh: '强制先更新 spec 仓库', en: 'Force repo update before check' }, common: false },
        { flag: '--no-repo-update', desc: { zh: '跳过 spec 仓库更新', en: 'Skip repo update' }, common: false },
      ],
      examples: [
        { cmd: 'pod outdated', desc: { zh: '列出所有可更新的 pod', en: 'List outdated pods' } },
      ],
      notes: { zh: '显示当前安装版本、最新版本和 Podfile 允许的最新版本。', en: 'Shows current, latest, and Podfile-allowed latest versions.' },
      related: ['pod update', 'pod install'],
    },
    {
      name: 'pod deintegrate', platforms: ['cli'],
      desc: { zh: '移除 CocoaPods', en: 'Deintegrate CocoaPods' },
      syntax: 'pod deintegrate [XCODEPROJ]',
      options: [
        { flag: '--allow-root', desc: { zh: '允许以 root 运行', en: 'Allow running as root' }, common: false },
      ],
      examples: [
        { cmd: 'pod deintegrate', desc: { zh: '从当前项目移除 CocoaPods', en: 'Deintegrate current project' } },
      ],
      notes: { zh: '彻底移除所有 CocoaPods 痕迹，包括 Pods 目录、xcworkspace 和项目引用。', en: 'Completely removes CocoaPods traces including Pods dir, xcworkspace, and project references.' },
      related: ['pod install'],
    },
    {
      name: 'pod env', platforms: ['cli'],
      desc: { zh: '显示 CocoaPods 环境', en: 'Show CocoaPods environment' },
      syntax: 'pod env',
      options: [],
      examples: [
        { cmd: 'pod env', desc: { zh: '显示 CocoaPods 环境', en: 'Show CocoaPods environment' } },
      ],
      notes: { zh: '显示 CocoaPods 版本、Ruby 版本、RubyGems 版本、Git 版本等环境信息。', en: 'Shows CocoaPods version, Ruby version, RubyGems version, Git version, etc.' },
      related: [],
    },
    {
      name: 'pod search', platforms: ['cli'],
      desc: { zh: '搜索 Pod', en: 'Search for pods' },
      syntax: 'pod search QUERY [OPTIONS]',
      options: [
        { flag: '--regex', desc: { zh: '使用正则表达式搜索', en: 'Interpret query as regex' }, common: false },
        { flag: '--simple', desc: { zh: '仅按名称搜索', en: 'Search by name only' }, common: true },
        { flag: '--stats', desc: { zh: '显示 GitHub 统计', en: 'Show GitHub stats' }, common: false },
      ],
      examples: [
        { cmd: 'pod search AFNetworking', desc: { zh: '搜索 AFNetworking', en: 'Search AFNetworking' } },
        { cmd: 'pod search --simple network', desc: { zh: '简单搜索名称含 network', en: 'Simple search network' } },
      ],
      notes: { zh: '默认在名称、摘要和描述中搜索。', en: 'Searches in name, summary, and description by default.' },
      related: ['pod list', 'pod try'],
    },
    {
      name: 'pod list', platforms: ['cli'],
      desc: { zh: '列出所有可用 Pod', en: 'List all available pods' },
      syntax: 'pod list [OPTIONS]',
      options: [
        { flag: '--update', desc: { zh: '先更新 spec 仓库', en: 'Update spec repos first' }, common: false },
      ],
      examples: [
        { cmd: 'pod list', desc: { zh: '列出所有可用 pod', en: 'List all available pods' } },
      ],
      notes: { zh: '列出所有本地 spec 仓库中已知的 pod。', en: 'Lists all known pods in local spec repos.' },
      related: ['pod search'],
    },
    {
      name: 'pod try', platforms: ['cli'],
      desc: { zh: '试用 Pod', en: 'Try a pod' },
      syntax: 'pod try NAME_OR_URL [OPTIONS]',
      options: [
        { flag: '--no-repo-update', desc: { zh: '跳过 spec 仓库更新', en: 'Skip repo update' }, common: false },
      ],
      examples: [
        { cmd: 'pod try AFNetworking', desc: { zh: '试用 AFNetworking', en: 'Try AFNetworking' } },
        { cmd: 'pod try https://github.com/user/repo.git', desc: { zh: '试用指定 Git URL', en: 'Try from Git URL' } },
      ],
      notes: { zh: '打开 pod 的示例项目以便快速体验。支持 pod 名称或 Git URL。', en: 'Opens the pod demo project for quick evaluation.' },
      related: ['pod search', 'pod install'],
    },
    {
      name: 'pod spec create', platforms: ['cli'],
      desc: { zh: '创建 podspec', en: 'Create a podspec' },
      syntax: 'pod spec create [NAME] [URL]',
      options: [],
      examples: [
        { cmd: 'pod spec create MyLibrary', desc: { zh: '创建 MyLibrary.podspec', en: 'Create MyLibrary.podspec' } },
        { cmd: 'pod spec create https://github.com/user/repo', desc: { zh: '基于 GitHub 仓库创建', en: 'Create from GitHub repo' } },
      ],
      notes: { zh: 'URL 可以是 GitHub 仓库地址或本地路径。', en: 'URL can be a GitHub repo address or local path.' },
      related: ['pod spec lint'],
    },
    {
      name: 'pod spec lint', platforms: ['cli'],
      desc: { zh: '验证 podspec', en: 'Validate a podspec' },
      syntax: 'pod spec lint [NAME.podspec|DIRECTORY|URL] [OPTIONS]',
      options: [
        { flag: '--quick', desc: { zh: '仅检查语法', en: 'Lint without full validation' }, common: true },
        { flag: '--allow-warnings', desc: { zh: '允许警告', en: 'Allow warnings' }, common: false },
        { flag: '--subspec=NAME', desc: { zh: '只验证指定 subspec', en: 'Lint only given subspec' }, common: false },
        { flag: '--no-subspecs', desc: { zh: '不验证 subspec', en: 'Skip subspecs' }, common: false },
        { flag: '--fail-fast', desc: { zh: '首次失败即停止', en: 'Stop on first failure' }, common: false },
      ],
      examples: [
        { cmd: 'pod spec lint MyLibrary.podspec', desc: { zh: '验证 podspec', en: 'Validate podspec' } },
        { cmd: 'pod spec lint --quick', desc: { zh: '快速验证', en: 'Quick lint' } },
      ],
      notes: { zh: '验证 podspec 的语法和语义正确性。', en: 'Validates the syntax and semantics of the podspec.' },
      related: ['pod spec create', 'pod lib lint'],
    },
    {
      name: 'pod spec cat', platforms: ['cli'],
      desc: { zh: '查看 podspec 内容', en: 'View podspec contents' },
      syntax: 'pod spec cat NAME',
      options: [
        { flag: '--regex', desc: { zh: '使用正则表达式', en: 'Interpret query as regex' }, common: false },
      ],
      examples: [
        { cmd: 'pod spec cat AFNetworking', desc: { zh: '查看 AFNetworking podspec', en: 'View AFNetworking podspec' } },
      ],
      notes: { zh: '从本地 spec 仓库中查看 podspec 的完整内容。', en: 'Prints the contents of the podspec from local spec repo.' },
      related: ['pod spec which', 'pod spec edit'],
    },
    {
      name: 'pod spec which', platforms: ['cli'],
      desc: { zh: '查找 podspec 路径', en: 'Find podspec path' },
      syntax: 'pod spec which NAME [OPTIONS]',
      options: [
        { flag: '--regex', desc: { zh: '使用正则表达式', en: 'Interpret query as regex' }, common: false },
        { flag: '--show-all', desc: { zh: '显示所有匹配路径', en: 'Show all matching paths' }, common: false },
      ],
      examples: [
        { cmd: 'pod spec which AFNetworking', desc: { zh: '查找 AFNetworking podspec 路径', en: 'Find AFNetworking podspec' } },
      ],
      notes: { zh: '打印 podspec 文件在本地 spec 仓库中的路径。', en: 'Prints the path of the podspec in the local spec repo.' },
      related: ['pod spec cat'],
    },
    {
      name: 'pod spec edit', platforms: ['cli'],
      desc: { zh: '编辑 podspec', en: 'Edit a podspec' },
      syntax: 'pod spec edit NAME [OPTIONS]',
      options: [
        { flag: '--regex', desc: { zh: '使用正则表达式', en: 'Interpret query as regex' }, common: false },
      ],
      examples: [
        { cmd: 'pod spec edit AFNetworking', desc: { zh: '编辑 AFNetworking podspec', en: 'Edit AFNetworking podspec' } },
      ],
      notes: { zh: '使用系统默认编辑器打开 podspec。', en: 'Opens the podspec in the system default editor.' },
      related: ['pod spec cat', 'pod spec which'],
    },
    {
      name: 'pod trunk add-owner', platforms: ['cli'],
      desc: { zh: '添加 pod 所有者', en: 'Add owner to a pod' },
      syntax: 'pod trunk add-owner POD OWNER-EMAIL',
      options: [],
      examples: [
        { cmd: 'pod trunk add-owner AFNetworking user@example.com', desc: { zh: '添加所有者', en: 'Add owner' } },
      ],
      notes: { zh: '只有当前所有者才能添加新所有者。', en: 'Only current owners can add new owners.' },
      related: ['pod trunk remove-owner', 'pod trunk push'],
    },
    {
      name: 'pod trunk info', platforms: ['cli'],
      desc: { zh: '查看 pod 信息', en: 'Show pod info' },
      syntax: 'pod trunk info POD',
      options: [],
      examples: [
        { cmd: 'pod trunk info AFNetworking', desc: { zh: '查看 AFNetworking 信息', en: 'View AFNetworking info' } },
      ],
      notes: { zh: '显示 pod 的所有者、版本历史等信息。', en: 'Shows owners, version history, etc.' },
      related: ['pod trunk me'],
    },
    {
      name: 'pod trunk me', platforms: ['cli'],
      desc: { zh: '显示当前用户信息', en: 'Show current user info' },
      syntax: 'pod trunk me',
      options: [],
      examples: [
        { cmd: 'pod trunk me', desc: { zh: '显示当前用户信息', en: 'Show current user info' } },
      ],
      notes: { zh: '显示当前登录用户的会话信息和拥有的 pods。', en: 'Shows session info and owned pods for the current user.' },
      related: ['pod trunk info'],
    },
    {
      name: 'pod trunk push', platforms: ['cli'],
      desc: { zh: '发布 podspec', en: 'Publish a podspec' },
      syntax: 'pod trunk push [PATH] [OPTIONS]',
      options: [
        { flag: '--allow-warnings', desc: { zh: '允许警告', en: 'Allow warnings' }, common: false },
        { flag: '--use-libraries', desc: { zh: '使用静态库', en: 'Use static libraries' }, common: false },
        { flag: '--skip-import-validation', desc: { zh: '跳过导入验证', en: 'Skip import validation' }, common: false },
        { flag: '--synchronous', desc: { zh: '同步验证', en: 'Synchronous validation' }, common: false },
      ],
      examples: [
        { cmd: 'pod trunk push MyLibrary.podspec', desc: { zh: '发布 podspec', en: 'Publish podspec' } },
      ],
      notes: { zh: '需要先注册并验证邮箱。podspec 必须通过验证才能发布。', en: 'Requires registration and email verification. Podspec must pass validation.' },
      related: ['pod trunk register', 'pod spec lint'],
    },
    {
      name: 'pod trunk register', platforms: ['cli'],
      desc: { zh: '注册 trunk 用户', en: 'Register trunk user' },
      syntax: 'pod trunk register EMAIL [NAME]',
      options: [
        { flag: '--description=DESC', desc: { zh: '会话描述', en: 'Session description' }, common: false },
      ],
      examples: [
        { cmd: 'pod trunk register user@example.com', desc: { zh: '注册新用户', en: 'Register new user' } },
      ],
      notes: { zh: '会向邮箱发送验证链接，点击后完成注册。', en: 'Sends a verification link to the email address.' },
      related: ['pod trunk push'],
    },
    {
      name: 'pod trunk remove-owner', platforms: ['cli'],
      desc: { zh: '移除 pod 所有者', en: 'Remove owner from a pod' },
      syntax: 'pod trunk remove-owner POD OWNER-EMAIL',
      options: [],
      examples: [
        { cmd: 'pod trunk remove-owner AFNetworking user@example.com', desc: { zh: '移除所有者', en: 'Remove owner' } },
      ],
      notes: { zh: '只有当前所有者才能移除其他所有者。', en: 'Only current owners can remove other owners.' },
      related: ['pod trunk add-owner'],
    },
    {
      name: 'pod trunk deprecate', platforms: ['cli'],
      desc: { zh: '弃用 pod 版本', en: 'Deprecate a pod version' },
      syntax: 'pod trunk deprecate POD [VERSION]',
      options: [
        { flag: '--in-favor-of=POD', desc: { zh: '推荐替代 pod', en: 'Recommended replacement' }, common: false },
      ],
      examples: [
        { cmd: 'pod trunk deprecate AFNetworking', desc: { zh: '弃用 AFNetworking', en: 'Deprecate AFNetworking' } },
        { cmd: 'pod trunk deprecate AFNetworking --in-favor-of=Alamofire', desc: { zh: '弃用并推荐替代', en: 'Deprecate with replacement' } },
      ],
      notes: { zh: '弃用 pod 会在搜索结果中隐藏，但不会影响已安装的项目。', en: 'Deprecating hides the pod from search but does not affect installed projects.' },
      related: ['pod trunk delete'],
    },
    {
      name: 'pod trunk delete', platforms: ['cli'],
      desc: { zh: '删除 pod 版本', en: 'Delete a pod version' },
      syntax: 'pod trunk delete POD VERSION',
      options: [],
      examples: [
        { cmd: 'pod trunk delete AFNetworking 1.0.0', desc: { zh: '删除指定版本', en: 'Delete specific version' } },
      ],
      notes: { zh: '谨慎操作！删除后无法恢复，用户将无法安装该版本。', en: 'Use with caution! Deletion is irreversible.' },
      related: ['pod trunk deprecate'],
    },
    {
      name: 'pod repo add', platforms: ['cli'],
      desc: { zh: '添加 spec 仓库', en: 'Add a spec repo' },
      syntax: 'pod repo add NAME URL [BRANCH]',
      options: [],
      examples: [
        { cmd: 'pod repo add artsy https://github.com/artsy/Specs.git', desc: { zh: '添加自定义仓库', en: 'Add custom repo' } },
      ],
      notes: { zh: 'URL 可以是 git 地址、本地路径或远程 tarball。', en: 'URL can be a git address, local path, or remote tarball.' },
      related: ['pod repo list', 'pod repo remove'],
    },
    {
      name: 'pod repo add-cdn', platforms: ['cli'],
      desc: { zh: '添加 CDN spec 仓库', en: 'Add a CDN spec repo' },
      syntax: 'pod repo add-cdn NAME URL',
      options: [],
      examples: [
        { cmd: 'pod repo add-cdn trunk https://cdn.cocoapods.org/', desc: { zh: '添加 CDN 源', en: 'Add CDN source' } },
      ],
      notes: { zh: 'CDN 源比 git 源更快、更轻量，适合大规模仓库。', en: 'CDN sources are faster and lighter than git sources.' },
      related: ['pod repo add'],
    },
    {
      name: 'pod repo update', platforms: ['cli'],
      desc: { zh: '更新 spec 仓库', en: 'Update spec repos' },
      syntax: 'pod repo update [NAME] [OPTIONS]',
      options: [
        { flag: '--silent', desc: { zh: '静默模式', en: 'Silent mode' }, common: false },
      ],
      examples: [
        { cmd: 'pod repo update', desc: { zh: '更新所有仓库', en: 'Update all repos' } },
        { cmd: 'pod repo update master', desc: { zh: '更新 master 仓库', en: 'Update master repo' } },
      ],
      notes: { zh: '不带参数时更新所有仓库。install/update 会自动更新。', en: 'Updates all repos if no name given.' },
      related: ['pod repo list', 'pod install'],
    },
    {
      name: 'pod repo lint', platforms: ['cli'],
      desc: { zh: '验证 spec 仓库', en: 'Validate a spec repo' },
      syntax: 'pod repo lint [NAME|URL]',
      options: [
        { flag: '--only-errors', desc: { zh: '仅显示错误', en: 'Only show errors' }, common: false },
      ],
      examples: [
        { cmd: 'pod repo lint master', desc: { zh: '验证 master 仓库', en: 'Lint master repo' } },
      ],
      notes: { zh: '验证仓库中所有 podspec 的语法和语义。', en: 'Validates syntax and semantics of all podspecs in the repo.' },
      related: ['pod spec lint'],
    },
    {
      name: 'pod repo list', platforms: ['cli'],
      desc: { zh: '列出 spec 仓库', en: 'List spec repos' },
      syntax: 'pod repo list',
      options: [],
      examples: [
        { cmd: 'pod repo list', desc: { zh: '列出所有仓库', en: 'List all repos' } },
      ],
      notes: { zh: '显示所有已配置的 spec 仓库及其 URL 和类型。', en: 'Shows all configured spec repos with URLs and types.' },
      related: ['pod repo add', 'pod repo remove'],
    },
    {
      name: 'pod repo remove', platforms: ['cli'],
      desc: { zh: '移除 spec 仓库', en: 'Remove a spec repo' },
      syntax: 'pod repo remove NAME',
      options: [],
      examples: [
        { cmd: 'pod repo remove artsy', desc: { zh: '移除 artsy 仓库', en: 'Remove artsy repo' } },
      ],
      notes: { zh: '删除本地 spec 仓库的副本。', en: 'Deletes the local copy of the spec repo.' },
      related: ['pod repo add'],
    },
    {
      name: 'pod repo push', platforms: ['cli'],
      desc: { zh: '推送 podspec 到私有仓库', en: 'Push podspec to private repo' },
      syntax: 'pod repo push REPO [NAME.podspec] [OPTIONS]',
      options: [
        { flag: '--allow-warnings', desc: { zh: '允许警告', en: 'Allow warnings' }, common: false },
        { flag: '--use-libraries', desc: { zh: '使用静态库', en: 'Use static libraries' }, common: false },
        { flag: '--sources=URL', desc: { zh: '指定依赖源', en: 'Specify dependency sources' }, common: false },
      ],
      examples: [
        { cmd: 'pod repo push my-specs MyLibrary.podspec', desc: { zh: '推送到私有仓库', en: 'Push to private repo' } },
      ],
      notes: { zh: '用于推送 podspec 到私有 spec 仓库。', en: 'Pushes podspec to a private spec repo.' },
      related: ['pod trunk push', 'pod spec lint'],
    },
    {
      name: 'pod setup', platforms: ['cli'],
      desc: { zh: '初始化 CocoaPods', en: 'Set up CocoaPods' },
      syntax: 'pod setup',
      options: [],
      examples: [
        { cmd: 'pod setup', desc: { zh: '初始化 CocoaPods', en: 'Set up CocoaPods' } },
      ],
      notes: { zh: '首次安装 CocoaPods 后必须运行，将 master spec 仓库克隆到本地。', en: 'Must run after first installation; clones master spec repo to local.' },
      related: ['pod install', 'pod init'],
    },
    {
      name: 'pod lib create', platforms: ['cli'],
      desc: { zh: '创建 Pod 库项目', en: 'Create a pod library project' },
      syntax: 'pod lib create NAME',
      options: [
        { flag: '--template-url=URL', desc: { zh: '自定义模板 URL', en: 'Custom template URL' }, common: false },
      ],
      examples: [
        { cmd: 'pod lib create MyLibrary', desc: { zh: '创建 MyLibrary 项目', en: 'Create MyLibrary project' } },
      ],
      notes: { zh: '根据 CocoaPods 最佳实践创建 pod 开发脚手架。', en: 'Creates pod development scaffold according to best practices.' },
      related: ['pod spec create', 'pod lib lint'],
    },
    {
      name: 'pod lib lint', platforms: ['cli'],
      desc: { zh: '验证本地 Pod', en: 'Validate a local pod' },
      syntax: 'pod lib lint [NAME.podspec|PATH] [OPTIONS]',
      options: [
        { flag: '--quick', desc: { zh: '快速验证', en: 'Quick lint' }, common: true },
        { flag: '--allow-warnings', desc: { zh: '允许警告', en: 'Allow warnings' }, common: false },
        { flag: '--subspec=NAME', desc: { zh: '只验证指定 subspec', en: 'Lint only given subspec' }, common: false },
        { flag: '--no-subspecs', desc: { zh: '不验证 subspec', en: 'Skip subspecs' }, common: false },
      ],
      examples: [
        { cmd: 'pod lib lint', desc: { zh: '验证当前目录 pod', en: 'Lint current directory pod' } },
        { cmd: 'pod lib lint --quick', desc: { zh: '快速验证', en: 'Quick lint' } },
      ],
      notes: { zh: '验证本地 podspec 和源代码是否可编译。', en: 'Validates if the local podspec and source code are compilable.' },
      related: ['pod spec lint', 'pod lib create'],
    },
    {
      name: 'pod ipc repl', platforms: ['cli'],
      desc: { zh: '交互式 Ruby REPL', en: 'Interactive Ruby REPL' },
      syntax: 'pod ipc repl',
      options: [],
      examples: [
        { cmd: 'pod ipc repl', desc: { zh: '启动 REPL', en: 'Start REPL' } },
      ],
      notes: { zh: '启动一个带有 CocoaPods 环境加载的 Ruby REPL。', en: 'Starts a Ruby REPL with CocoaPods environment loaded.' },
      related: [],
    },
    {
      name: 'pod ipc spec', platforms: ['cli'],
      desc: { zh: '转换 podspec 为 JSON', en: 'Convert podspec to JSON' },
      syntax: 'pod ipc spec PODSPEC',
      options: [],
      examples: [
        { cmd: 'pod ipc spec MyLibrary.podspec', desc: { zh: '转换为 JSON', en: 'Convert to JSON' } },
      ],
      notes: { zh: '将 .podspec 文件转换为 JSON 格式输出到 stdout。', en: 'Converts .podspec file to JSON and outputs to stdout.' },
      related: ['pod ipc podfile-json'],
    },
    {
      name: 'pod ipc podfile', platforms: ['cli'],
      desc: { zh: '转换 Podfile 为 YAML', en: 'Convert Podfile to YAML' },
      syntax: 'pod ipc podfile PODFILE',
      options: [],
      examples: [
        { cmd: 'pod ipc podfile Podfile', desc: { zh: '转换为 YAML', en: 'Convert to YAML' } },
      ],
      notes: { zh: '将 Podfile 转换为 YAML 格式输出到 stdout。', en: 'Converts Podfile to YAML and outputs to stdout.' },
      related: ['pod ipc podfile-json'],
    },
    {
      name: 'pod ipc podfile-json', platforms: ['cli'],
      desc: { zh: '转换 Podfile 为 JSON', en: 'Convert Podfile to JSON' },
      syntax: 'pod ipc podfile-json PODFILE',
      options: [],
      examples: [
        { cmd: 'pod ipc podfile-json Podfile', desc: { zh: '转换为 JSON', en: 'Convert to JSON' } },
      ],
      notes: { zh: '将 Podfile 转换为 JSON 格式输出到 stdout。', en: 'Converts Podfile to JSON and outputs to stdout.' },
      related: ['pod ipc podfile'],
    },
    {
      name: 'pod ipc list', platforms: ['cli'],
      desc: { zh: '列出已知 pods', en: 'List known pods' },
      syntax: 'pod ipc list',
      options: [],
      examples: [
        { cmd: 'pod ipc list', desc: { zh: '列出已知 pods', en: 'List known pods' } },
      ],
      notes: { zh: '以 JSON 格式输出所有已知 pods 的列表。', en: 'Outputs a JSON list of all known pods.' },
      related: ['pod ipc spec'],
    },
    {
      name: 'pod ipc update-search-index', platforms: ['cli'],
      desc: { zh: '更新搜索索引', en: 'Update search index' },
      syntax: 'pod ipc update-search-index',
      options: [],
      examples: [
        { cmd: 'pod ipc update-search-index', desc: { zh: '更新搜索索引', en: 'Update search index' } },
      ],
      notes: { zh: '更新 pod 搜索的本地索引文件。', en: 'Updates the local index file for pod search.' },
      related: ['pod search'],
    },
    {
      name: 'pod plugins list', platforms: ['cli'],
      desc: { zh: '列出所有插件', en: 'List all plugins' },
      syntax: 'pod plugins list [QUERY] [OPTIONS]',
      options: [
        { flag: '--verbose', desc: { zh: '显示详细信息', en: 'Show detailed info' }, common: false },
      ],
      examples: [
        { cmd: 'pod plugins list', desc: { zh: '列出所有插件', en: 'List all plugins' } },
      ],
      notes: { zh: '根据 GitHub 上 CocoaPods/cocoapods-plugins 列表列出所有已知插件。', en: 'Lists all known plugins from CocoaPods/cocoapods-plugins on GitHub.' },
      related: ['pod plugins search'],
    },
    {
      name: 'pod plugins search', platforms: ['cli'],
      desc: { zh: '搜索插件', en: 'Search for plugins' },
      syntax: 'pod plugins search QUERY [OPTIONS]',
      options: [
        { flag: '--full', desc: { zh: '全文搜索', en: 'Full text search' }, common: false },
      ],
      examples: [
        { cmd: 'pod plugins search lint', desc: { zh: '搜索 lint 插件', en: 'Search lint plugins' } },
      ],
      notes: { zh: '在 CocoaPods 插件列表中搜索。', en: 'Searches in the CocoaPods plugin list.' },
      related: ['pod plugins list'],
    },
    {
      name: 'pod plugins installed', platforms: ['cli'],
      desc: { zh: '列出已安装插件', en: 'List installed plugins' },
      syntax: 'pod plugins installed',
      options: [],
      examples: [
        { cmd: 'pod plugins installed', desc: { zh: '列出已安装插件', en: 'List installed plugins' } },
      ],
      notes: { zh: '列出所有已安装的 CocoaPods 插件及其版本。', en: 'Lists all installed CocoaPods plugins and their versions.' },
      related: ['pod plugins list'],
    },
    {
      name: 'pod plugins create', platforms: ['cli'],
      desc: { zh: '创建新插件', en: 'Create a new plugin' },
      syntax: 'pod plugins create NAME',
      options: [],
      examples: [
        { cmd: 'pod plugins create my-plugin', desc: { zh: '创建新插件', en: 'Create new plugin' } },
      ],
      notes: { zh: '创建新的 CocoaPods 插件项目结构。', en: 'Creates scaffold for a new CocoaPods plugin.' },
      related: ['pod plugins publish'],
    },
    {
      name: 'pod plugins publish', platforms: ['cli'],
      desc: { zh: '发布插件', en: 'Publish a plugin' },
      syntax: 'pod plugins publish',
      options: [],
      examples: [
        { cmd: 'pod plugins publish', desc: { zh: '发布插件', en: 'Publish plugin' } },
      ],
      notes: { zh: '将插件发布到 CocoaPods 插件注册表。', en: 'Publishes plugin to CocoaPods plugin registry.' },
      related: ['pod plugins create'],
    },
    {
      name: 'pod cache list', platforms: ['cli'],
      desc: { zh: '列出缓存', en: 'List cache' },
      syntax: 'pod cache list [NAME] [OPTIONS]',
      options: [
        { flag: '--short', desc: { zh: '简短输出', en: 'Short output' }, common: false },
      ],
      examples: [
        { cmd: 'pod cache list', desc: { zh: '列出所有缓存', en: 'List all cache' } },
        { cmd: 'pod cache list AFNetworking', desc: { zh: '列出 AFNetworking 缓存', en: 'List AFNetworking cache' } },
      ],
      notes: { zh: '列出 CocoaPods 下载缓存中的 pod。', en: 'Lists pods in the CocoaPods download cache.' },
      related: ['pod cache clean'],
    },
    {
      name: 'pod cache clean', platforms: ['cli'],
      desc: { zh: '清理缓存', en: 'Clean cache' },
      syntax: 'pod cache clean [NAME] [OPTIONS]',
      options: [
        { flag: '--all', desc: { zh: '清理所有缓存', en: 'Clean all cache' }, common: true },
      ],
      examples: [
        { cmd: 'pod cache clean AFNetworking', desc: { zh: '清理 AFNetworking 缓存', en: 'Clean AFNetworking cache' } },
        { cmd: 'pod cache clean --all', desc: { zh: '清理所有缓存', en: 'Clean all cache' } },
      ],
      notes: { zh: '删除 CocoaPods 缓存中的 pod 文件。', en: 'Removes cached pod files from CocoaPods cache.' },
      related: ['pod cache list'],
    },
    {
      name: 'pod --version', platforms: ['cli'],
      desc: { zh: '显示版本', en: 'Show version' },
      syntax: 'pod --version',
      options: [],
      examples: [
        { cmd: 'pod --version', desc: { zh: '显示 CocoaPods 版本号', en: 'Show CocoaPods version' } },
      ],
      notes: { zh: '显示当前安装的 CocoaPods 版本号。', en: 'Displays the currently installed CocoaPods version.' },
      related: ['pod env'],
    },
    /* ─── Podspec DSL ─── */
    {
      name: 'spec.name', platforms: ['dsl'],
      desc: { zh: 'Pod 名称', en: 'Pod name' },
      syntax: "spec.name = 'Name'",
      options: [],
      examples: [
        { cmd: "spec.name = 'AFNetworking'", desc: { zh: '设置名称', en: 'Set name' } },
      ],
      notes: { zh: 'pod 的名称，与 podspec 文件名一致。', en: 'The name of the pod, should match the podspec file name.' },
      related: ['spec.version'],
    },
    {
      name: 'spec.version', platforms: ['dsl'],
      desc: { zh: '版本号', en: 'Version' },
      syntax: "spec.version = 'X.Y.Z'",
      options: [],
      examples: [
        { cmd: "spec.version = '3.2.1'", desc: { zh: '设置版本', en: 'Set version' } },
      ],
      notes: { zh: '遵循语义化版本规范。', en: 'Should follow Semantic Versioning.' },
      related: ['spec.name'],
    },
    {
      name: 'spec.swift_versions', platforms: ['dsl'],
      desc: { zh: '支持的 Swift 版本', en: 'Supported Swift versions' },
      syntax: "spec.swift_versions = ['5.0']",
      options: [],
      examples: [
        { cmd: "spec.swift_versions = ['5.0', '5.1']", desc: { zh: '多版本支持', en: 'Multiple versions' } },
      ],
      notes: { zh: '指定 pod 支持的 Swift 版本列表。', en: 'Specifies the list of Swift versions the pod supports.' },
      related: ['spec.cocoapods_version'],
    },
    {
      name: 'spec.cocoapods_version', platforms: ['dsl'],
      desc: { zh: '支持的 CocoaPods 版本', en: 'Supported CocoaPods version' },
      syntax: "spec.cocoapods_version = '>= X.Y'",
      options: [],
      examples: [
        { cmd: "spec.cocoapods_version = '>= 0.36'", desc: { zh: '最低版本要求', en: 'Minimum version' } },
      ],
      notes: { zh: '指定处理此 podspec 所需的最低 CocoaPods 版本。', en: 'Specifies the minimum CocoaPods version required to process this podspec.' },
      related: ['spec.swift_versions'],
    },
    {
      name: 'spec.authors', platforms: ['dsl'],
      desc: { zh: '作者信息', en: 'Authors' },
      syntax: "spec.authors = { 'Name' => 'email@example.com' }",
      options: [],
      examples: [
        { cmd: "spec.authors = { 'John' => 'john@example.com', 'Jane' => 'jane@example.com' }", desc: { zh: '多作者', en: 'Multiple authors' } },
      ],
      notes: { zh: '可以是字符串（单作者）或字典（多作者）。', en: 'Can be a string (single author) or hash (multiple authors).' },
      related: ['spec.license'],
    },
    {
      name: 'spec.social_media_url', platforms: ['dsl'],
      desc: { zh: '社交媒体 URL', en: 'Social media URL' },
      syntax: "spec.social_media_url = 'https://twitter.com/name'",
      options: [],
      examples: [
        { cmd: "spec.social_media_url = 'https://twitter.com/cocoapods'", desc: { zh: 'Twitter 链接', en: 'Twitter link' } },
      ],
      notes: { zh: '用于 CocoaPods 网站显示。', en: 'Used for display on CocoaPods website.' },
      related: ['spec.homepage'],
    },
    {
      name: 'spec.license', platforms: ['dsl'],
      desc: { zh: '许可证', en: 'License' },
      syntax: "spec.license = { :type => 'MIT', :file => 'LICENSE' }",
      options: [],
      examples: [
        { cmd: "spec.license = 'MIT'", desc: { zh: '简写形式', en: 'Short form' } },
        { cmd: "spec.license = { :type => 'MIT', :file => 'LICENSE' }", desc: { zh: '完整形式', en: 'Full form' } },
      ],
      notes: { zh: '可以是字符串（简写）或字典（完整）。', en: 'Can be a string (short form) or hash (full form).' },
      related: ['spec.authors'],
    },
    {
      name: 'spec.homepage', platforms: ['dsl'],
      desc: { zh: '项目主页', en: 'Homepage' },
      syntax: "spec.homepage = 'https://example.com'",
      options: [],
      examples: [
        { cmd: "spec.homepage = 'https://github.com/AFNetworking/AFNetworking'", desc: { zh: 'GitHub 仓库', en: 'GitHub repo' } },
      ],
      notes: { zh: '项目的主页 URL。', en: 'The URL of the project homepage.' },
      related: ['spec.source'],
    },
    {
      name: 'spec.readme', platforms: ['dsl'],
      desc: { zh: 'README 文件', en: 'README file' },
      syntax: "spec.readme = 'docs/README.md'",
      options: [],
      examples: [
        { cmd: "spec.readme = 'README.md'", desc: { zh: '指定 README', en: 'Specify README' } },
      ],
      notes: { zh: '指定 pod 的 README 文件路径。', en: 'Specifies the path to the README file.' },
      related: ['spec.documentation_url'],
    },
    {
      name: 'spec.changelog', platforms: ['dsl'],
      desc: { zh: '变更日志', en: 'Changelog' },
      syntax: "spec.changelog = 'CHANGELOG.md'",
      options: [],
      examples: [
        { cmd: "spec.changelog = 'CHANGELOG.md'", desc: { zh: '指定变更日志', en: 'Specify changelog' } },
      ],
      notes: { zh: '指定 pod 的变更日志文件路径。', en: 'Specifies the path to the changelog file.' },
      related: ['spec.readme'],
    },
    {
      name: 'spec.source', platforms: ['dsl'],
      desc: { zh: '源码位置', en: 'Source location' },
      syntax: "spec.source = { :git => 'URL', :tag => 'v1.0.0' }",
      options: [],
      examples: [
        { cmd: "spec.source = { :git => 'https://github.com/user/repo.git', :tag => 'v1.0.0' }", desc: { zh: 'Git 标签', en: 'Git tag' } },
        { cmd: "spec.source = { :git => 'https://github.com/user/repo.git', :branch => 'main' }", desc: { zh: 'Git 分支', en: 'Git branch' } },
        { cmd: "spec.source = { :git => 'https://github.com/user/repo.git', :commit => 'abc123' }", desc: { zh: 'Git commit', en: 'Git commit' } },
        { cmd: "spec.source = { :http => 'https://example.com/file.zip' }", desc: { zh: 'HTTP 下载', en: 'HTTP download' } },
      ],
      notes: { zh: '支持 :git、:svn、:hg、:http 等多种源类型。', en: 'Supports :git, :svn, :hg, :http, and other source types.' },
      related: ['spec.homepage'],
    },
    {
      name: 'spec.summary', platforms: ['dsl'],
      desc: { zh: '简短描述', en: 'Short description' },
      syntax: "spec.summary = 'Short description of the pod.'",
      options: [],
      examples: [
        { cmd: "spec.summary = 'A delightful networking framework.'", desc: { zh: '简短描述', en: 'Short description' } },
      ],
      notes: { zh: '一句话描述 pod 的功能，最大 140 字符。', en: 'A short description of the pod functionality, max 140 characters.' },
      related: ['spec.description'],
    },
    {
      name: 'spec.description', platforms: ['dsl'],
      desc: { zh: '详细描述', en: 'Detailed description' },
      syntax: "spec.description = 'Detailed description of the pod.'",
      options: [],
      examples: [
        { cmd: "spec.description = 'A longer description of the pod...'", desc: { zh: '详细描述', en: 'Detailed description' } },
      ],
      notes: { zh: '比 summary 更详细的描述，支持多行。未设置时默认使用 summary。', en: 'Longer description than summary, supports multi-line. Defaults to summary if not set.' },
      related: ['spec.summary'],
    },
    {
      name: 'spec.screenshots', platforms: ['dsl'],
      desc: { zh: '截图 URL', en: 'Screenshots' },
      syntax: "spec.screenshots = ['https://example.com/screenshot1.png']",
      options: [],
      examples: [
        { cmd: "spec.screenshots = ['https://example.com/1.png', 'https://example.com/2.png']", desc: { zh: '多张截图', en: 'Multiple screenshots' } },
      ],
      notes: { zh: '用于 CocoaPods 网站展示的截图 URL 列表。', en: 'URLs of screenshots for display on CocoaPods website.' },
      related: ['spec.documentation_url'],
    },
    {
      name: 'spec.documentation_url', platforms: ['dsl'],
      desc: { zh: '文档 URL', en: 'Documentation URL' },
      syntax: "spec.documentation_url = 'https://example.com/docs'",
      options: [],
      examples: [
        { cmd: "spec.documentation_url = 'https://github.com/user/repo/wiki'", desc: { zh: '文档链接', en: 'Documentation link' } },
      ],
      notes: { zh: '自定义文档 URL，覆盖默认生成的 CocoaDocs 链接。', en: 'Custom documentation URL, overrides the default CocoaDocs link.' },
      related: ['spec.homepage'],
    },
    {
      name: 'spec.prepare_command', platforms: ['dsl'],
      desc: { zh: '安装前执行的命令', en: 'Pre-install command' },
      syntax: "spec.prepare_command = 'ruby prepare.rb'",
      options: [],
      examples: [
        { cmd: "spec.prepare_command = 'ruby prepare.rb'", desc: { zh: '执行准备脚本', en: 'Run prepare script' } },
      ],
      notes: { zh: '在 pod 下载后执行，用于编译资源、修改文件等准备工作。', en: 'Executed after the pod is downloaded, used for compiling resources, modifying files, etc.' },
      related: ['spec.script_phases'],
    },
    {
      name: 'spec.static_framework', platforms: ['dsl'],
      desc: { zh: '静态 framework', en: 'Static framework' },
      syntax: 'spec.static_framework = true',
      options: [],
      examples: [
        { cmd: 'spec.static_framework = true', desc: { zh: '设为静态 framework', en: 'Set as static framework' } },
      ],
      notes: { zh: '将此 pod 设为静态 framework。', en: 'Sets this pod as a static framework.' },
      related: ['spec.frameworks'],
    },
    {
      name: 'spec.deprecated', platforms: ['dsl'],
      desc: { zh: '弃用标记', en: 'Deprecated flag' },
      syntax: 'spec.deprecated = true',
      options: [],
      examples: [
        { cmd: 'spec.deprecated = true', desc: { zh: '标记为弃用', en: 'Mark as deprecated' } },
      ],
      notes: { zh: '标记此 pod 已弃用。', en: 'Marks this pod as deprecated.' },
      related: ['spec.deprecated_in_favor_of'],
    },
    {
      name: 'spec.deprecated_in_favor_of', platforms: ['dsl'],
      desc: { zh: '推荐替代 pod', en: 'Recommended replacement' },
      syntax: "spec.deprecated_in_favor_of = 'NewPod'",
      options: [],
      examples: [
        { cmd: "spec.deprecated_in_favor_of = 'Alamofire'", desc: { zh: '推荐替代', en: 'Recommended replacement' } },
      ],
      notes: { zh: '指定用户应该迁移到的替代 pod。', en: 'Specifies the alternative pod users should migrate to.' },
      related: ['spec.deprecated'],
    },
    {
      name: 'spec.platform', platforms: ['dsl'],
      desc: { zh: '支持平台', en: 'Supported platform' },
      syntax: "spec.platform = :ios, '9.0'",
      options: [],
      examples: [
        { cmd: "spec.platform = :ios, '9.0'", desc: { zh: 'iOS 9.0+', en: 'iOS 9.0+' } },
        { cmd: 'spec.platform = :osx', desc: { zh: 'macOS（使用默认版本）', en: 'macOS (default version)' } },
      ],
      notes: { zh: '限制 pod 仅支持单个平台。多平台请使用 deployment_target。', en: 'Restricts the pod to a single platform. For multi-platform use deployment_target.' },
      related: ['spec.ios.deployment_target'],
    },
    {
      name: 'spec.ios.deployment_target', platforms: ['dsl'],
      desc: { zh: 'iOS 最低版本', en: 'iOS deployment target' },
      syntax: "spec.ios.deployment_target = '9.0'",
      options: [],
      examples: [
        { cmd: "spec.ios.deployment_target = '9.0'", desc: { zh: 'iOS 9.0+', en: 'iOS 9.0+' } },
      ],
      notes: { zh: '指定 iOS 最低支持版本。', en: 'Specifies the minimum iOS version supported.' },
      related: ['spec.platform', 'spec.osx.deployment_target'],
    },
    {
      name: 'spec.osx.deployment_target', platforms: ['dsl'],
      desc: { zh: 'macOS 最低版本', en: 'macOS deployment target' },
      syntax: "spec.osx.deployment_target = '10.10'",
      options: [],
      examples: [
        { cmd: "spec.osx.deployment_target = '10.10'", desc: { zh: 'macOS 10.10+', en: 'macOS 10.10+' } },
      ],
      notes: { zh: '指定 macOS 最低支持版本。', en: 'Specifies the minimum macOS version supported.' },
      related: ['spec.ios.deployment_target'],
    },
    {
      name: 'spec.tvos.deployment_target', platforms: ['dsl'],
      desc: { zh: 'tvOS 最低版本', en: 'tvOS deployment target' },
      syntax: "spec.tvos.deployment_target = '10.0'",
      options: [],
      examples: [
        { cmd: "spec.tvos.deployment_target = '10.0'", desc: { zh: 'tvOS 10.0+', en: 'tvOS 10.0+' } },
      ],
      notes: { zh: '指定 tvOS 最低支持版本。', en: 'Specifies the minimum tvOS version supported.' },
      related: ['spec.ios.deployment_target'],
    },
    {
      name: 'spec.watchos.deployment_target', platforms: ['dsl'],
      desc: { zh: 'watchOS 最低版本', en: 'watchOS deployment target' },
      syntax: "spec.watchos.deployment_target = '4.0'",
      options: [],
      examples: [
        { cmd: "spec.watchos.deployment_target = '4.0'", desc: { zh: 'watchOS 4.0+', en: 'watchOS 4.0+' } },
      ],
      notes: { zh: '指定 watchOS 最低支持版本。', en: 'Specifies the minimum watchOS version supported.' },
      related: ['spec.ios.deployment_target'],
    },
    {
      name: 'spec.visionos.deployment_target', platforms: ['dsl'],
      desc: { zh: 'visionOS 最低版本', en: 'visionOS deployment target' },
      syntax: "spec.visionos.deployment_target = '1.0'",
      options: [],
      examples: [
        { cmd: "spec.visionos.deployment_target = '1.0'", desc: { zh: 'visionOS 1.0+', en: 'visionOS 1.0+' } },
      ],
      notes: { zh: '指定 visionOS 最低支持版本。', en: 'Specifies the minimum visionOS version supported.' },
      related: ['spec.ios.deployment_target'],
    },
    {
      name: 'spec.dependency', platforms: ['dsl'],
      desc: { zh: '依赖声明', en: 'Dependency declaration' },
      syntax: "spec.dependency 'PodName', ['~> 1.0']",
      options: [],
      examples: [
        { cmd: "spec.dependency 'AFNetworking', '~> 3.0'", desc: { zh: '带版本约束', en: 'With version constraint' } },
        { cmd: "spec.dependency 'AFNetworking/Reachability'", desc: { zh: '子 spec 依赖', en: 'Subspec dependency' } },
      ],
      notes: { zh: '声明 pod 依赖的其他 pod，可指定版本约束。', en: 'Declares other pods this pod depends on, with optional version constraints.' },
      related: ['spec.frameworks'],
    },
    {
      name: 'spec.info_plist', platforms: ['dsl'],
      desc: { zh: 'Info.plist 条目', en: 'Info.plist entries' },
      syntax: "spec.info_plist = { 'key' => 'value' }",
      options: [],
      examples: [
        { cmd: "spec.info_plist = { 'CFBundleIdentifier' => 'com.example' }", desc: { zh: '自定义 bundle ID', en: 'Custom bundle ID' } },
      ],
      notes: { zh: '添加到生成的 Info.plist 中的键值对。', en: 'Key-value pairs to add to the generated Info.plist.' },
      related: ['spec.pod_target_xcconfig'],
    },
    {
      name: 'spec.requires_arc', platforms: ['dsl'],
      desc: { zh: '需要 ARC', en: 'Requires ARC' },
      syntax: 'spec.requires_arc = true',
      options: [],
      examples: [
        { cmd: 'spec.requires_arc = true', desc: { zh: '需要 ARC', en: 'Requires ARC' } },
        { cmd: "spec.requires_arc = ['Classes/ARC']", desc: { zh: '指定 ARC 文件', en: 'Specify ARC files' } },
      ],
      notes: { zh: '指定是否需要 ARC。可以是布尔值或文件列表。', en: 'Specifies whether ARC is required. Can be boolean or file list.' },
      related: ['spec.compiler_flags'],
    },
    {
      name: 'spec.frameworks', platforms: ['dsl'],
      desc: { zh: '系统 frameworks', en: 'System frameworks' },
      syntax: "spec.frameworks = 'UIKit', 'Foundation'",
      options: [],
      examples: [
        { cmd: "spec.frameworks = 'UIKit', 'Foundation'", desc: { zh: '多 framework', en: 'Multiple frameworks' } },
      ],
      notes: { zh: '指定 pod 依赖的系统 frameworks。', en: 'Specifies the system frameworks the pod depends on.' },
      related: ['spec.weak_frameworks'],
    },
    {
      name: 'spec.weak_frameworks', platforms: ['dsl'],
      desc: { zh: '弱引用 frameworks', en: 'Weak frameworks' },
      syntax: "spec.weak_frameworks = 'Twitter'",
      options: [],
      examples: [
        { cmd: "spec.weak_frameworks = 'Twitter'", desc: { zh: '弱引用 Twitter', en: 'Weak link Twitter' } },
      ],
      notes: { zh: '指定需要弱链接的系统 frameworks。', en: 'Specifies the system frameworks that should be weakly linked.' },
      related: ['spec.frameworks'],
    },
    {
      name: 'spec.libraries', platforms: ['dsl'],
      desc: { zh: '系统库', en: 'System libraries' },
      syntax: "spec.libraries = 'z', 'sqlite3'",
      options: [],
      examples: [
        { cmd: "spec.libraries = 'z', 'sqlite3'", desc: { zh: '系统库', en: 'System libraries' } },
      ],
      notes: { zh: '指定 pod 依赖的系统库（不加 lib 前缀）。', en: 'Specifies system libraries the pod depends on (without lib prefix).' },
      related: ['spec.frameworks'],
    },
    {
      name: 'spec.compiler_flags', platforms: ['dsl'],
      desc: { zh: '编译器标志', en: 'Compiler flags' },
      syntax: "spec.compiler_flags = '-Wno-unused-variable'",
      options: [],
      examples: [
        { cmd: "spec.compiler_flags = '-Wno-unused-variable'", desc: { zh: '禁用警告', en: 'Suppress warning' } },
      ],
      notes: { zh: '传递给编译器的额外标志。', en: 'Additional flags to pass to the compiler.' },
      related: ['spec.pod_target_xcconfig'],
    },
    {
      name: 'spec.pod_target_xcconfig', platforms: ['dsl'],
      desc: { zh: 'Pod target 构建设置', en: 'Pod target build settings' },
      syntax: "spec.pod_target_xcconfig = { 'OTHER_LDFLAGS' => '-lObjC' }",
      options: [],
      examples: [
        { cmd: "spec.pod_target_xcconfig = { 'OTHER_LDFLAGS' => '-lObjC' }", desc: { zh: '链接标志', en: 'Linker flags' } },
      ],
      notes: { zh: '添加到 pod target 的构建设置。', en: 'Build settings to add to the pod target.' },
      related: ['spec.user_target_xcconfig'],
    },
    {
      name: 'spec.user_target_xcconfig', platforms: ['dsl'],
      desc: { zh: '用户 target 构建设置', en: 'User target build settings' },
      syntax: "spec.user_target_xcconfig = { 'MY_VAR' => 'YES' }",
      options: [],
      examples: [
        { cmd: "spec.user_target_xcconfig = { 'MY_VAR' => 'YES' }", desc: { zh: '自定义变量', en: 'Custom variable' } },
      ],
      notes: { zh: '添加到用户 target（即主项目）的构建设置。', en: 'Build settings to add to the user target (main project).' },
      related: ['spec.pod_target_xcconfig'],
    },
    {
      name: 'spec.prefix_header_contents', platforms: ['dsl'],
      desc: { zh: '前缀头内容', en: 'Prefix header contents' },
      syntax: "spec.prefix_header_contents = '#import <UIKit/UIKit.h>'",
      options: [],
      examples: [
        { cmd: "spec.prefix_header_contents = '#import <UIKit/UIKit.h>'", desc: { zh: '添加 import', en: 'Add import' } },
      ],
      notes: { zh: '添加到前缀头文件的内容。', en: 'Contents to add to the prefix header.' },
      related: ['spec.prefix_header_file'],
    },
    {
      name: 'spec.prefix_header_file', platforms: ['dsl'],
      desc: { zh: '前缀头文件路径', en: 'Prefix header file' },
      syntax: "spec.prefix_header_file = 'iphone/include/prefix.pch'",
      options: [],
      examples: [
        { cmd: "spec.prefix_header_file = 'iphone/include/prefix.pch'", desc: { zh: '指定 pch 文件', en: 'Specify pch file' } },
      ],
      notes: { zh: '使用指定文件作为前缀头。', en: 'Uses the specified file as the prefix header.' },
      related: ['spec.prefix_header_contents'],
    },
    {
      name: 'spec.module_name', platforms: ['dsl'],
      desc: { zh: '模块名称', en: 'Module name' },
      syntax: "spec.module_name = 'Rich'",
      options: [],
      examples: [
        { cmd: "spec.module_name = 'Rich'", desc: { zh: '自定义模块名', en: 'Custom module name' } },
      ],
      notes: { zh: '用于生成 modulemap 的模块名称。', en: 'The name to use for the module in the generated modulemap.' },
      related: ['spec.module_map'],
    },
    {
      name: 'spec.header_dir', platforms: ['dsl'],
      desc: { zh: '头文件目录', en: 'Header directory' },
      syntax: "spec.header_dir = 'Headers'",
      options: [],
      examples: [
        { cmd: "spec.header_dir = 'Headers'", desc: { zh: '头文件目录', en: 'Header directory' } },
      ],
      notes: { zh: '头文件所在的目录。', en: 'The directory where headers should be placed.' },
      related: ['spec.header_mappings_dir'],
    },
    {
      name: 'spec.header_mappings_dir', platforms: ['dsl'],
      desc: { zh: '头文件映射目录', en: 'Header mappings directory' },
      syntax: "spec.header_mappings_dir = 'src/include'",
      options: [],
      examples: [
        { cmd: "spec.header_mappings_dir = 'src/include'", desc: { zh: '头文件映射目录', en: 'Header mappings dir' } },
      ],
      notes: { zh: '用于保持头文件目录结构的根目录。', en: 'The root directory to preserve header directory structure.' },
      related: ['spec.header_dir'],
    },
    {
      name: 'spec.script_phases', platforms: ['dsl'],
      desc: { zh: '构建脚本阶段', en: 'Script phases' },
      syntax: "spec.script_phases = { :name => 'Hello', :script => 'echo Hello' }",
      options: [],
      examples: [
        { cmd: "spec.script_phases = { :name => 'Hello', :script => 'echo Hello' }", desc: { zh: '添加脚本', en: 'Add script' } },
      ],
      notes: { zh: '添加到构建过程的脚本阶段。', en: 'Script phases to add to the build process.' },
      related: ['spec.prepare_command'],
    },
    {
      name: 'spec.source_files', platforms: ['dsl'],
      desc: { zh: '源文件模式', en: 'Source files pattern' },
      syntax: "spec.source_files = 'Classes/**/*.{h,m}'",
      options: [],
      examples: [
        { cmd: "spec.source_files = 'Classes/**/*.{h,m}'", desc: { zh: '源文件通配符', en: 'Source file glob' } },
        { cmd: "spec.source_files = ['Classes/**/*.{h,m}', 'Vendor/**/*.swift']", desc: { zh: '多路径数组', en: 'Multiple paths array' } },
      ],
      notes: { zh: '指定哪些源文件应包含在 pod 中。', en: 'Specifies which source files should be included in the pod.' },
      related: ['spec.exclude_files'],
    },
    {
      name: 'spec.public_header_files', platforms: ['dsl'],
      desc: { zh: '公共头文件', en: 'Public header files' },
      syntax: "spec.public_header_files = 'Classes/Public/*.h'",
      options: [],
      examples: [
        { cmd: "spec.public_header_files = 'Classes/Public/*.h'", desc: { zh: '公共头文件', en: 'Public headers' } },
      ],
      notes: { zh: '指定哪些头文件是公共 API。', en: 'Specifies which headers are part of the public API.' },
      related: ['spec.private_header_files'],
    },
    {
      name: 'spec.project_header_files', platforms: ['dsl'],
      desc: { zh: '项目头文件', en: 'Project header files' },
      syntax: "spec.project_header_files = 'Classes/Project/*.h'",
      options: [],
      examples: [
        { cmd: "spec.project_header_files = 'Classes/Project/*.h'", desc: { zh: '项目头文件', en: 'Project headers' } },
      ],
      notes: { zh: '指定项目头文件（用于 Swift Package Manager 桥接）。', en: 'Project headers for Swift Package Manager bridging.' },
      related: ['spec.public_header_files'],
    },
    {
      name: 'spec.private_header_files', platforms: ['dsl'],
      desc: { zh: '私有头文件', en: 'Private header files' },
      syntax: "spec.private_header_files = 'Classes/Private/*.h'",
      options: [],
      examples: [
        { cmd: "spec.private_header_files = 'Classes/Private/*.h'", desc: { zh: '私有头文件', en: 'Private headers' } },
      ],
      notes: { zh: '指定哪些头文件是私有的，不暴露给用户。', en: 'Specifies which headers are private and not exposed to users.' },
      related: ['spec.public_header_files'],
    },
    {
      name: 'spec.vendored_frameworks', platforms: ['dsl'],
      desc: { zh: 'vendored frameworks', en: 'Vendored frameworks' },
      syntax: "spec.vendored_frameworks = 'Frameworks/MyFramework.framework'",
      options: [],
      examples: [
        { cmd: "spec.vendored_frameworks = 'Frameworks/MyFramework.framework'", desc: { zh: 'vendored framework', en: 'Vendored framework' } },
      ],
      notes: { zh: '包含的预编译 frameworks。', en: 'Pre-compiled frameworks to include.' },
      related: ['spec.vendored_libraries'],
    },
    {
      name: 'spec.vendored_libraries', platforms: ['dsl'],
      desc: { zh: 'vendored 库', en: 'Vendored libraries' },
      syntax: "spec.vendored_libraries = 'libMyLibrary.a'",
      options: [],
      examples: [
        { cmd: "spec.vendored_libraries = 'libMyLibrary.a'", desc: { zh: 'vendored 库', en: 'Vendored library' } },
      ],
      notes: { zh: '包含的预编译静态库。', en: 'Pre-compiled static libraries to include.' },
      related: ['spec.vendored_frameworks'],
    },
    {
      name: 'spec.on_demand_resources', platforms: ['dsl'],
      desc: { zh: '按需资源', en: 'On demand resources' },
      syntax: "spec.on_demand_resources = { 'tag' => { :paths => ['path'], :category => :download_only } }",
      options: [],
      examples: [
        { cmd: "spec.on_demand_resources = { 'images' => { :paths => ['assets/images'] } }", desc: { zh: '按需资源', en: 'On demand resources' } },
      ],
      notes: { zh: 'iOS 9+ 的 On Demand Resources 配置。', en: 'On Demand Resources configuration for iOS 9+.' },
      related: ['spec.resources'],
    },
    {
      name: 'spec.resource_bundles', platforms: ['dsl'],
      desc: { zh: '资源 bundle', en: 'Resource bundles' },
      syntax: "spec.resource_bundles = { 'MyBundle' => ['Resources/**/*.png'] }",
      options: [],
      examples: [
        { cmd: "spec.resource_bundles = { 'MyBundle' => ['Resources/**/*.png'] }", desc: { zh: '资源 bundle', en: 'Resource bundle' } },
      ],
      notes: { zh: '将资源打包为命名 bundle，避免冲突。', en: 'Packages resources into named bundles to avoid conflicts.' },
      related: ['spec.resources'],
    },
    {
      name: 'spec.resources', platforms: ['dsl'],
      desc: { zh: '资源文件', en: 'Resource files' },
      syntax: "spec.resources = 'Resources/**/*.png'",
      options: [],
      examples: [
        { cmd: "spec.resources = 'Resources/**/*.png'", desc: { zh: '资源文件', en: 'Resource files' } },
      ],
      notes: { zh: '直接复制到应用 bundle 的资源文件。', en: 'Resource files copied directly to the app bundle.' },
      related: ['spec.resource_bundles'],
    },
    {
      name: 'spec.exclude_files', platforms: ['dsl'],
      desc: { zh: '排除文件', en: 'Excluded files' },
      syntax: "spec.exclude_files = 'Classes/Exclude'",
      options: [],
      examples: [
        { cmd: "spec.exclude_files = 'Classes/Exclude'", desc: { zh: '排除文件', en: 'Exclude files' } },
      ],
      notes: { zh: '从 source_files 中排除的文件模式。', en: 'File patterns to exclude from source_files.' },
      related: ['spec.source_files'],
    },
    {
      name: 'spec.preserve_paths', platforms: ['dsl'],
      desc: { zh: '保留路径', en: 'Preserve paths' },
      syntax: "spec.preserve_paths = 'IMPORTANT.txt'",
      options: [],
      examples: [
        { cmd: "spec.preserve_paths = 'IMPORTANT.txt'", desc: { zh: '保留文件', en: 'Preserve file' } },
      ],
      notes: { zh: '保留但不参与编译的文件路径。', en: 'Files to preserve but not compile.' },
      related: ['spec.source_files'],
    },
    {
      name: 'spec.module_map', platforms: ['dsl'],
      desc: { zh: '模块映射文件', en: 'Module map file' },
      syntax: "spec.module_map = 'module.modulemap'",
      options: [],
      examples: [
        { cmd: "spec.module_map = 'module.modulemap'", desc: { zh: '自定义 modulemap', en: 'Custom modulemap' } },
      ],
      notes: { zh: '指定自定义 modulemap 文件。', en: 'Specifies a custom modulemap file.' },
      related: ['spec.module_name'],
    },
    {
      name: 'spec.subspec', platforms: ['dsl'],
      desc: { zh: '子规范', en: 'Subspec' },
      syntax: "spec.subspec 'Name' do |ss| ... end",
      options: [],
      examples: [
        { cmd: "spec.subspec 'Core' do |ss|\n  ss.source_files = 'Core/**/*.{h,m}'\nend", desc: { zh: '子规范', en: 'Subspec' } },
      ],
      notes: { zh: '定义 pod 的子模块，允许用户选择性安装。', en: 'Defines sub-modules of the pod for selective installation.' },
      related: ['spec.default_subspecs'],
    },
    {
      name: 'spec.requires_app_host', platforms: ['dsl'],
      desc: { zh: '需要应用 host', en: 'Requires app host' },
      syntax: 'spec.requires_app_host = true',
      options: [],
      examples: [
        { cmd: 'spec.requires_app_host = true', desc: { zh: '需要应用 host', en: 'Requires app host' } },
      ],
      notes: { zh: '测试 spec 是否需要应用 host 才能运行。', en: 'Whether the test spec requires an app host to run.' },
      related: ['spec.app_host_name'],
    },
    {
      name: 'spec.app_host_name', platforms: ['dsl'],
      desc: { zh: '应用 host 名称', en: 'App host name' },
      syntax: "spec.app_host_name = 'MyApp'",
      options: [],
      examples: [
        { cmd: "spec.app_host_name = 'MyApp'", desc: { zh: '指定 host 名称', en: 'Specify host name' } },
      ],
      notes: { zh: '指定测试 spec 使用的应用 host 目标名称。', en: 'The target name of the app host for the test spec.' },
      related: ['spec.requires_app_host'],
    },
    {
      name: 'spec.scheme', platforms: ['dsl'],
      desc: { zh: 'scheme 配置', en: 'Scheme configuration' },
      syntax: "spec.scheme = { :launch_arguments => ['arg1'] }",
      options: [],
      examples: [
        { cmd: "spec.scheme = { :launch_arguments => ['arg1'] }", desc: { zh: 'scheme 配置', en: 'Scheme config' } },
      ],
      notes: { zh: '配置测试 scheme 的启动参数等。', en: 'Configures test scheme launch arguments, etc.' },
      related: ['spec.test_spec'],
    },
    {
      name: 'spec.test_spec', platforms: ['dsl'],
      desc: { zh: '测试规范', en: 'Test spec' },
      syntax: "spec.test_spec 'Tests' do |test_spec| ... end",
      options: [],
      examples: [
        { cmd: "spec.test_spec 'Tests' do |test_spec|\n  test_spec.source_files = 'Tests/**/*.{h,m}'\nend", desc: { zh: '测试规范', en: 'Test spec' } },
      ],
      notes: { zh: '定义测试专用子规范。', en: 'Defines a test-specific subspec.' },
      related: ['spec.app_spec'],
    },
    {
      name: 'spec.app_spec', platforms: ['dsl'],
      desc: { zh: '应用规范', en: 'App spec' },
      syntax: "spec.app_spec 'App' do |app_spec| ... end",
      options: [],
      examples: [
        { cmd: "spec.app_spec 'App' do |app_spec|\n  app_spec.source_files = 'App/**/*.{h,m}'\nend", desc: { zh: '应用规范', en: 'App spec' } },
      ],
      notes: { zh: '定义应用专用子规范。', en: 'Defines an app-specific subspec.' },
      related: ['spec.test_spec'],
    },
    {
      name: 'spec.default_subspecs', platforms: ['dsl'],
      desc: { zh: '默认子规范', en: 'Default subspecs' },
      syntax: "spec.default_subspecs = 'Core', 'UI'",
      options: [],
      examples: [
        { cmd: "spec.default_subspecs = 'Core', 'UI'", desc: { zh: '默认安装 Core 和 UI', en: 'Default install Core and UI' } },
      ],
      notes: { zh: '未指定 subspec 时默认安装的子规范。', en: 'Subspecs to install by default when none is specified.' },
      related: ['spec.subspec'],
    },
    {
      name: 'spec.ios', platforms: ['dsl'],
      desc: { zh: 'iOS 平台配置', en: 'iOS platform configuration' },
      syntax: "spec.ios do |ios| ... end",
      options: [],
      examples: [
        { cmd: "spec.ios do |ios|\n  ios.source_files = 'Classes/ios/*'\nend", desc: { zh: 'iOS 特定配置', en: 'iOS specific config' } },
      ],
      notes: { zh: '多平台支持：定义 iOS 平台特定配置。', en: 'Multi-platform support: iOS specific configuration.' },
      related: ['spec.osx'],
    },
    {
      name: 'spec.osx', platforms: ['dsl'],
      desc: { zh: 'macOS 平台配置', en: 'macOS platform configuration' },
      syntax: "spec.osx do |osx| ... end",
      options: [],
      examples: [
        { cmd: "spec.osx do |osx|\n  osx.source_files = 'Classes/osx/*'\nend", desc: { zh: 'macOS 特定配置', en: 'macOS specific config' } },
      ],
      notes: { zh: '多平台支持：定义 macOS 平台特定配置。', en: 'Multi-platform support: macOS specific configuration.' },
      related: ['spec.ios'],
    },
    {
      name: 'spec.macos', platforms: ['dsl'],
      desc: { zh: 'macOS 平台配置（别名）', en: 'macOS platform configuration (alias)' },
      syntax: "spec.macos do |macos| ... end",
      options: [],
      examples: [
        { cmd: "spec.macos do |macos|\n  macos.source_files = 'Classes/macos/*'\nend", desc: { zh: 'macOS 特定配置', en: 'macOS specific config' } },
      ],
      notes: { zh: 'osx 的别名，两者功能相同。', en: 'Alias for osx, same functionality.' },
      related: ['spec.osx'],
    },
    {
      name: 'spec.tvos', platforms: ['dsl'],
      desc: { zh: 'tvOS 平台配置', en: 'tvOS platform configuration' },
      syntax: "spec.tvos do |tvos| ... end",
      options: [],
      examples: [
        { cmd: "spec.tvos do |tvos|\n  tvos.source_files = 'Classes/tvos/*'\nend", desc: { zh: 'tvOS 特定配置', en: 'tvOS specific config' } },
      ],
      notes: { zh: '多平台支持：定义 tvOS 平台特定配置。', en: 'Multi-platform support: tvOS specific configuration.' },
      related: ['spec.ios'],
    },
    {
      name: 'spec.watchos', platforms: ['dsl'],
      desc: { zh: 'watchOS 平台配置', en: 'watchOS platform configuration' },
      syntax: "spec.watchos do |watchos| ... end",
      options: [],
      examples: [
        { cmd: "spec.watchos do |watchos|\n  watchos.source_files = 'Classes/watchos/*'\nend", desc: { zh: 'watchOS 特定配置', en: 'watchOS specific config' } },
      ],
      notes: { zh: '多平台支持：定义 watchOS 平台特定配置。', en: 'Multi-platform support: watchOS specific configuration.' },
      related: ['spec.ios'],
    },
    {
      name: 'spec.visionos', platforms: ['dsl'],
      desc: { zh: 'visionOS 平台配置', en: 'visionOS platform configuration' },
      syntax: "spec.visionos do |visionos| ... end",
      options: [],
      examples: [
        { cmd: "spec.visionos do |visionos|\n  visionos.source_files = 'Classes/visionos/*'\nend", desc: { zh: 'visionOS 特定配置', en: 'visionOS specific config' } },
      ],
      notes: { zh: '多平台支持：定义 visionOS 平台特定配置。', en: 'Multi-platform support: visionOS specific configuration.' },
      related: ['spec.ios'],
    },
    /* ─── Podfile DSL ─── */
    {
      name: 'install!', platforms: ['podfile'],
      desc: { zh: '声明安装方法和选项', en: 'Declares the installation method and options' },
      syntax: "install! 'cocoapods', :deterministic_uuids => false",
      options: [
        { flag: ':clean', desc: { zh: '安装时是否清理 pod 源文件', en: 'Whether to clean pod sources during installation' }, common: true },
        { flag: ':deduplicate_targets', desc: { zh: '是否去重 pod 目标', en: 'Whether to deduplicate pod targets' }, common: true },
        { flag: ':deterministic_uuids', desc: { zh: '是否生成确定性 UUID', en: 'Whether to generate deterministic UUIDs' }, common: true },
        { flag: ':integrate_targets', desc: { zh: '是否将 pod 集成到用户项目', en: 'Whether to integrate pods into user project' }, common: true },
        { flag: ':lock_pod_sources', desc: { zh: '是否锁定 pod 源文件', en: 'Whether to lock pod source files' }, common: true },
        { flag: ':warn_for_multiple_pod_sources', desc: { zh: '多个源包含同名 pod 时是否警告', en: 'Warn when multiple sources contain same pod' }, common: true },
        { flag: ':warn_for_unused_master_specs_repo', desc: { zh: '未显式指定 git master specs repo 时是否警告', en: 'Warn if not explicitly using git-based master specs repo' }, common: true },
        { flag: ':share_schemes_for_development_pods', desc: { zh: '是否共享 development pods 的 scheme', en: 'Share Xcode schemes for development pods' }, common: false },
        { flag: ':disable_input_output_paths', desc: { zh: '是否禁用 input/output paths', en: 'Disable input & output paths of CocoaPods script phases' }, common: false },
        { flag: ':preserve_pod_file_structure', desc: { zh: '是否保留 pod 文件结构', en: 'Preserve file structure of all Pods' }, common: false },
        { flag: ':generate_multiple_pod_projects', desc: { zh: '是否为每个 pod 目标生成独立项目', en: 'Generate a project per pod target' }, common: false },
        { flag: ':incremental_installation', desc: { zh: '是否启用增量安装', en: 'Only regenerate changed targets' }, common: false },
        { flag: ':skip_pods_project_generation', desc: { zh: '是否跳过 Pods.xcodeproj 生成', en: 'Skip generating Pods.xcodeproj' }, common: false },
        { flag: ':parallel_pod_downloads', desc: { zh: '是否并行下载 pods', en: 'Download pods in parallel' }, common: false },
        { flag: ':parallel_pod_download_thread_pool_size', desc: { zh: '并行下载线程池大小', en: 'Thread pool size for parallel downloads' }, common: false },
      ],
      examples: [
        { cmd: "install! 'cocoapods', :deterministic_uuids => false", desc: { zh: '关闭确定性 UUID', en: 'Disable deterministic UUIDs' } },
        { cmd: "install! 'cocoapods', :integrate_targets => false", desc: { zh: '不集成到用户项目', en: 'Do not integrate into user project' } },
        { cmd: "install! 'cocoapods', :clean => false, :deduplicate_targets => false", desc: { zh: '多选项组合', en: 'Multiple options combined' } },
      ],
      notes: { zh: 'install! 必须是 Podfile 中第一个命令，只能在顶层使用。', en: 'install! must be the first statement in the Podfile, used at the top level only.' },
      related: ['pod', 'target'],
    },
    {
      name: 'ensure_bundler!', platforms: ['podfile'],
      desc: { zh: '检查 Bundler 版本', en: 'Check Bundler version' },
      syntax: 'ensure_bundler! [version]',
      options: [],
      examples: [
        { cmd: 'ensure_bundler!', desc: { zh: '检查 Bundler', en: 'Check Bundler' } },
        { cmd: "ensure_bundler! '~> 2.0.0'", desc: { zh: '指定版本要求', en: 'Specify version requirement' } },
      ],
      notes: { zh: '当通过 Gemfile 管理 CocoaPods 版本时非常有用。', en: 'Useful when managing CocoaPods versions via Gemfile.' },
      related: ['install!'],
    },
    {
      name: 'pod', platforms: ['podfile'],
      desc: { zh: '声明项目依赖的 Pod', en: 'Declares a dependency on a Pod' },
      syntax: "pod 'Name', ['~> 1.0'], [options]",
      options: [
        { flag: "'~> 1.0'", desc: { zh: '语义化版本约束', en: 'Semantic version constraint' }, common: true },
        { flag: ":git => 'URL'", desc: { zh: '从 Git 仓库获取', en: 'Fetch from Git repository' }, common: true },
        { flag: ":branch => 'name'", desc: { zh: '指定 Git 分支', en: 'Specify Git branch' }, common: false },
        { flag: ":tag => 'v1.0'", desc: { zh: '指定 Git 标签', en: 'Specify Git tag' }, common: false },
        { flag: ":commit => 'sha'", desc: { zh: '指定 Git commit', en: 'Specify Git commit' }, common: false },
        { flag: ":path => '~/local/path'", desc: { zh: '本地路径开发', en: 'Local path for development' }, common: true },
        { flag: ":podspec => 'URL'", desc: { zh: '从 URL 加载 podspec', en: 'Load podspec from URL' }, common: false },
        { flag: ":source => 'URL'", desc: { zh: '指定源仓库', en: 'Specify source repository' }, common: false },
        { flag: ":subspecs => ['SubA', 'SubB']", desc: { zh: '只安装指定 subspec', en: 'Install only specified subspecs' }, common: false },
        { flag: ":testspecs => ['Tests']", desc: { zh: '安装测试 spec', en: 'Install test specs' }, common: false },
        { flag: ':modular_headers => true', desc: { zh: '使用 modular headers', en: 'Use modular headers' }, common: false },
        { flag: ':inhibit_warnings => true', desc: { zh: '抑制该 pod 的警告', en: 'Inhibit warnings for this pod' }, common: false },
        { flag: ":configurations => ['Debug']", desc: { zh: '只在指定配置安装', en: 'Install only in specified build configurations' }, common: false },
      ],
      examples: [
        { cmd: "pod 'AFNetworking'", desc: { zh: '安装最新版本', en: 'Install latest version' } },
        { cmd: "pod 'AFNetworking', '~> 3.0'", desc: { zh: '版本约束', en: 'Version constraint' } },
        { cmd: "pod 'AFNetworking', :git => 'https://github.com/AFNetworking/AFNetworking.git'", desc: { zh: 'Git 源', en: 'Git source' } },
        { cmd: "pod 'MyLib', :path => '../MyLib'", desc: { zh: '本地开发', en: 'Local development' } },
        { cmd: "pod 'PonyDebugger', :configurations => ['Debug']", desc: { zh: '仅 Debug 配置', en: 'Debug only' } },
      ],
      notes: { zh: '版本运算符: =、>、>=、<、<=、~>。~> 1.2.3 等价于 >= 1.2.3 且 < 1.3.0。', en: 'Version operators: =, >, >=, <, <=, ~>. ~> 1.2.3 equals >= 1.2.3 and < 1.3.0.' },
      related: ['target', 'podspec', 'source'],
    },
    {
      name: 'podspec', platforms: ['podfile'],
      desc: { zh: '使用当前目录的 podspec 文件定义依赖', en: 'Uses the current directory podspec for dependencies' },
      syntax: 'podspec [options]',
      options: [
        { flag: ":name => 'SpecName'", desc: { zh: '指定 podspec 名称', en: 'Specify podspec name' }, common: false },
        { flag: ":path => '/path/to.podspec'", desc: { zh: '指定 podspec 路径', en: 'Specify podspec path' }, common: false },
      ],
      examples: [
        { cmd: 'podspec', desc: { zh: '使用默认 podspec', en: 'Use default podspec' } },
        { cmd: "podspec :path => '../MyLib.podspec'", desc: { zh: '指定 podspec 路径', en: 'Specify podspec path' } },
      ],
      notes: { zh: '主要用于库开发项目中，让 Podfile 直接使用库的 podspec 定义依赖。', en: 'Mainly used in library development projects to use the library podspec for dependencies.' },
      related: ['pod'],
    },
    {
      name: 'target', platforms: ['podfile'],
      desc: { zh: '定义 CocoaPods 目标，与 Xcode target 对应', en: 'Defines a CocoaPods target corresponding to an Xcode target' },
      syntax: "target 'Name' do ... end",
      options: [],
      examples: [
        { cmd: "target 'MyApp' do\n  pod 'AFNetworking'\nend", desc: { zh: '基本用法', en: 'Basic usage' } },
        { cmd: "target 'MyApp' do\n  pod 'AFNetworking'\n  target 'MyAppTests' do\n    inherit! :search_paths\n    pod 'OCMock'\n  end\nend", desc: { zh: '嵌套测试目标', en: 'Nested test targets' } },
      ],
      notes: { zh: '默认继承外部定义的依赖，除非使用 inherit! 指定不继承。', en: 'By default inherits dependencies defined outside the block unless inherit! is used.' },
      related: ['abstract_target', 'inherit!'],
    },
    {
      name: 'script_phase', platforms: ['podfile'],
      desc: { zh: '为目标添加脚本阶段', en: 'Adds a script phase to the target' },
      syntax: "script_phase :name => 'PhaseName', :script => 'echo Hello'",
      options: [
        { flag: ":name => 'PhaseName'", desc: { zh: '脚本阶段名称', en: 'Script phase name' }, common: true },
        { flag: ":script => 'echo Hello'", desc: { zh: '脚本内容', en: 'Script content' }, common: true },
        { flag: ":shell_path => '/bin/sh'", desc: { zh: 'Shell 路径', en: 'Shell path' }, common: false },
        { flag: ':input_files => []', desc: { zh: '输入文件列表', en: 'Input files' }, common: false },
        { flag: ':output_files => []', desc: { zh: '输出文件列表', en: 'Output files' }, common: false },
        { flag: ':execution_position => :before_compile', desc: { zh: '执行位置', en: 'Execution position' }, common: false },
      ],
      examples: [
        { cmd: "script_phase :name => 'HelloWorld', :script => 'echo \"Hello World\"'", desc: { zh: '基本脚本', en: 'Basic script' } },
        { cmd: "script_phase :name => 'RubyScript', :script => 'puts \"Hello\"', :shell_path => '/usr/bin/ruby'", desc: { zh: 'Ruby 脚本', en: 'Ruby script' } },
      ],
      notes: { zh: '多个 script_phase 按声明顺序添加。删除脚本阶段会从目标中移除。', en: 'Multiple script_phases are added in declaration order. Deleting removes it from the target.' },
      related: ['target'],
    },
    {
      name: 'abstract_target', platforms: ['podfile'],
      desc: { zh: '定义抽象目标，用于依赖继承', en: 'Defines an abstract target for dependency inheritance' },
      syntax: "abstract_target 'Name' do ... end",
      options: [],
      examples: [
        { cmd: "abstract_target 'Networking' do\n  pod 'Alamofire'\n  target 'App1'\n  target 'App2'\nend", desc: { zh: '共享依赖', en: 'Shared dependencies' } },
      ],
      notes: { zh: '抽象目标不直接链接到 Xcode target，只用于子 target 继承依赖。', en: 'Abstract targets are not linked to Xcode targets directly, only used for child target inheritance.' },
      related: ['target', 'abstract!'],
    },
    {
      name: 'abstract!', platforms: ['podfile'],
      desc: { zh: '标记当前目标为抽象目标', en: 'Denotes that the current target is abstract' },
      syntax: 'abstract!',
      options: [],
      examples: [
        { cmd: "target 'Shows' do\n  abstract!\n  pod 'ShowsKit'\nend", desc: { zh: '声明抽象目标', en: 'Declare abstract target' } },
      ],
      notes: { zh: '抽象目标不会直接链接到 Xcode target。', en: 'Abstract targets will not directly link against an Xcode target.' },
      related: ['abstract_target'],
    },
    {
      name: 'inherit!', platforms: ['podfile'],
      desc: { zh: '设置当前目标的继承模式', en: 'Sets the inheritance mode for the current target' },
      syntax: 'inherit! :mode',
      options: [
        { flag: ':complete', desc: { zh: '继承父目标全部行为', en: 'Inherit all behaviour from parent' }, common: true },
        { flag: ':none', desc: { zh: '不继承父目标任何行为', en: 'Inherit none from parent' }, common: true },
        { flag: ':search_paths', desc: { zh: '只继承搜索路径', en: 'Inherit only search paths' }, common: true },
      ],
      examples: [
        { cmd: "target 'AppTests' do\n  inherit! :search_paths\n  pod 'OCMock'\nend", desc: { zh: '仅继承搜索路径', en: 'Inherit search paths only' } },
      ],
      notes: { zh: '常用于测试目标，让其继承应用目标的搜索路径但独立安装测试依赖。', en: 'Commonly used in test targets to inherit search paths but install test dependencies independently.' },
      related: ['target'],
    },
    {
      name: 'platform', platforms: ['podfile'],
      desc: { zh: '指定目标平台及部署版本', en: 'Specifies the platform and deployment target' },
      syntax: "platform :name, 'deployment_target'",
      options: [
        { flag: ':ios', desc: { zh: 'iOS 平台', en: 'iOS platform' }, common: true },
        { flag: ':osx', desc: { zh: 'macOS 平台', en: 'macOS platform' }, common: true },
        { flag: ':tvos', desc: { zh: 'tvOS 平台', en: 'tvOS platform' }, common: true },
        { flag: ':watchos', desc: { zh: 'watchOS 平台', en: 'watchOS platform' }, common: true },
        { flag: ':visionos', desc: { zh: 'visionOS 平台', en: 'visionOS platform' }, common: true },
      ],
      examples: [
        { cmd: "platform :ios, '13.0'", desc: { zh: 'iOS 13.0+', en: 'iOS 13.0+' } },
        { cmd: "platform :osx, '10.15'", desc: { zh: 'macOS 10.15+', en: 'macOS 10.15+' } },
        { cmd: 'platform :tvos', desc: { zh: 'tvOS（使用默认版本）', en: 'tvOS (default version)' } },
      ],
      notes: { zh: '未指定部署版本时使用默认值（iOS 4.3, macOS 10.6, tvOS 9.0, watchOS 2.0, visionOS 1.0）。', en: 'Default deployment targets: iOS 4.3, macOS 10.6, tvOS 9.0, watchOS 2.0, visionOS 1.0.' },
      related: ['project'],
    },
    {
      name: 'project', platforms: ['podfile'],
      desc: { zh: '指定关联的 Xcode 项目', en: 'Specifies the Xcode project to link with' },
      syntax: "project 'Path', [build_configurations]",
      options: [
        { flag: "'Debug' => :debug", desc: { zh: '自定义构建配置映射', en: 'Custom build configuration mapping' }, common: false },
      ],
      examples: [
        { cmd: "project 'MyApp'", desc: { zh: '指定项目', en: 'Specify project' } },
        { cmd: "project 'MyApp', 'Mac App Store' => :release, 'Test' => :debug", desc: { zh: '自定义配置映射', en: 'Custom configuration mapping' } },
      ],
      notes: { zh: '如果不指定，CocoaPods 会在当前目录搜索唯一的 .xcodeproj 文件。', en: 'If not specified, CocoaPods searches for a single .xcodeproj in the current directory.' },
      related: ['platform', 'xcodeproj'],
    },
    {
      name: 'xcodeproj', platforms: ['podfile'],
      desc: { zh: '指定 Xcode 项目（已废弃，请使用 project）', en: 'Specifies the Xcode project (deprecated, use project instead)' },
      syntax: "xcodeproj 'Path'",
      options: [],
      examples: [
        { cmd: "xcodeproj 'MyApp'", desc: { zh: '指定项目（已废弃）', en: 'Specify project (deprecated)' } },
      ],
      notes: { zh: '在 CocoaPods 1.0 中已废弃，请改用 project。', en: 'Deprecated in CocoaPods 1.0. Use project instead.' },
      related: ['project'],
    },
    {
      name: 'link_with', platforms: ['podfile'],
      desc: { zh: '将 pods 链接到多个 target（已废弃）', en: 'Links pods to multiple targets (deprecated)' },
      syntax: "link_with 'Target1', 'Target2'",
      options: [],
      examples: [],
      notes: { zh: '在 CocoaPods 1.0 中已废弃，请改用 abstract_target 和 target 继承。', en: 'Deprecated in CocoaPods 1.0. Use abstract_target and target inheritance instead.' },
      related: ['target', 'abstract_target'],
    },
    {
      name: 'inhibit_all_warnings!', platforms: ['podfile'],
      desc: { zh: '抑制所有 CocoaPods 库的编译警告', en: 'Inhibits all warnings from CocoaPods libraries' },
      syntax: 'inhibit_all_warnings!',
      options: [],
      examples: [
        { cmd: 'inhibit_all_warnings!', desc: { zh: '全局抑制警告', en: 'Inhibit all warnings globally' } },
      ],
      notes: { zh: '可被单个 pod 的 :inhibit_warnings 选项覆盖。继承到子 target。', en: 'Can be overridden per pod with :inhibit_warnings option. Inherited by child targets.' },
      related: ['pod'],
    },
    {
      name: 'use_modular_headers!', platforms: ['podfile'],
      desc: { zh: '对所有 CocoaPods 静态库使用 modular headers', en: 'Use modular headers for all CocoaPods static libraries' },
      syntax: 'use_modular_headers!',
      options: [],
      examples: [
        { cmd: 'use_modular_headers!', desc: { zh: '全局启用 modular headers', en: 'Enable modular headers globally' } },
      ],
      notes: { zh: '可被单个 pod 的 :modular_headers 选项覆盖。继承到子 target。', en: 'Can be overridden per pod with :modular_headers option. Inherited by child targets.' },
      related: ['pod', 'use_frameworks!'],
    },
    {
      name: 'use_frameworks!', platforms: ['podfile'],
      desc: { zh: '对 Pods 使用 framework 而非静态库', en: 'Use frameworks instead of static libraries for Pods' },
      syntax: 'use_frameworks! [:linkage => :static/:dynamic]',
      options: [
        { flag: ':linkage => :static', desc: { zh: '静态链接', en: 'Static linkage' }, common: false },
        { flag: ':linkage => :dynamic', desc: { zh: '动态链接', en: 'Dynamic linkage' }, common: false },
      ],
      examples: [
        { cmd: 'use_frameworks!', desc: { zh: '使用 frameworks', en: 'Use frameworks' } },
        { cmd: 'use_frameworks! :linkage => :static', desc: { zh: '静态 framework', en: 'Static framework' } },
      ],
      notes: { zh: '继承到子 target。Swift pods 必须使用 frameworks。', en: 'Inherited by child targets. Swift pods require frameworks.' },
      related: ['use_modular_headers!'],
    },
    {
      name: 'supports_swift_versions', platforms: ['podfile'],
      desc: { zh: '指定目标支持的 Swift 版本要求', en: 'Specifies the Swift version requirements this target supports' },
      syntax: "supports_swift_versions 'req1', 'req2'",
      options: [],
      examples: [
        { cmd: "supports_swift_versions '>= 3.0', '< 4.0'", desc: { zh: '版本范围', en: 'Version range' } },
      ],
      notes: { zh: '继承自父目标。如果根级别未指定，则支持所有版本。', en: 'Inherited from parent. If not specified at root level, all versions are considered supported.' },
      related: ['target'],
    },
    {
      name: 'workspace', platforms: ['podfile'],
      desc: { zh: '指定包含所有项目的 Xcode workspace', en: 'Specifies the Xcode workspace that should contain all projects' },
      syntax: "workspace 'Name'",
      options: [],
      examples: [
        { cmd: "workspace 'MyWorkspace'", desc: { zh: '指定 workspace', en: 'Specify workspace' } },
      ],
      notes: { zh: '如果不指定且当前目录只有一个项目，则使用该项目名作为 workspace 名。', en: 'If not specified and only one project exists, that project name is used.' },
      related: ['project'],
    },
    {
      name: 'generate_bridge_support!', platforms: ['podfile'],
      desc: { zh: '从所有安装的 Pods 头文件生成 BridgeSupport 元数据', en: 'Generates BridgeSupport metadata from headers of all installed Pods' },
      syntax: 'generate_bridge_support!',
      options: [],
      examples: [
        { cmd: 'generate_bridge_support!', desc: { zh: '启用 BridgeSupport', en: 'Enable BridgeSupport' } },
      ],
      notes: { zh: '用于 MacRuby、Nu、JSCocoa 等脚本语言桥接类型和函数。', en: 'Used by scripting languages like MacRuby, Nu, and JSCocoa to bridge types and functions.' },
      related: [],
    },
    {
      name: 'set_arc_compatibility_flag!', platforms: ['podfile'],
      desc: { zh: '添加 -fobjc-arc 标志到 OTHER_LD_FLAGS', en: 'Adds the -fobjc-arc flag to OTHER_LD_FLAGS' },
      syntax: 'set_arc_compatibility_flag!',
      options: [],
      examples: [
        { cmd: 'set_arc_compatibility_flag!', desc: { zh: 'ARC 兼容标志', en: 'ARC compatibility flag' } },
      ],
      notes: { zh: '针对非 ARC 项目的编译器 bug 的变通方案。在 CocoaPods 1.0 中可能移除支持。', en: 'Workaround for a compiler bug with non-ARC projects. Support might be dropped in 1.0.' },
      related: [],
    },
    {
      name: 'source', platforms: ['podfile'],
      desc: { zh: '指定 specs 仓库的源地址', en: 'Specifies the location of specs repositories' },
      syntax: "source 'URL'",
      options: [],
      examples: [
        { cmd: "source 'https://github.com/artsy/Specs.git'", desc: { zh: '自定义源', en: 'Custom source' } },
        { cmd: "source 'https://cdn.cocoapods.org/'", desc: { zh: 'CDN 源', en: 'CDN source' } },
      ],
      notes: { zh: '源的顺序很重要。CocoaPods 会在第一个包含该 pod 的源中使用最高版本。', en: 'Source order matters. CocoaPods uses the highest version from the first source containing the pod.' },
      related: ['pod'],
    },
    {
      name: 'plugin', platforms: ['podfile'],
      desc: { zh: '指定安装过程中使用的插件', en: 'Specifies plugins to use during installation' },
      syntax: "plugin 'name', [options]",
      options: [],
      examples: [
        { cmd: "plugin 'cocoapods-keys', :keyring => 'Eidolon'", desc: { zh: '指定插件及选项', en: 'Specify plugin and options' } },
        { cmd: "plugin 'slather'", desc: { zh: '简单插件声明', en: 'Simple plugin declaration' } },
      ],
      notes: { zh: '钩子作用于全局，不按 target 存储。', en: 'Hooks are global and not stored per target definition.' },
      related: ['pre_install', 'post_install'],
    },
    {
      name: 'pre_install', platforms: ['podfile'],
      desc: { zh: '在 pods 下载后、安装前执行的钩子', en: 'Hook executed after pods are downloaded but before installation' },
      syntax: 'pre_install do |installer| ... end',
      options: [],
      examples: [
        { cmd: "pre_install do |installer|\n  # Do something fancy!\nend", desc: { zh: '基本用法', en: 'Basic usage' } },
      ],
      notes: { zh: '接收 Pod::Installer 作为唯一参数。用于在正式安装前修改 pod。', en: 'Receives the Pod::Installer as its only argument. Use to make changes to pods before installation.' },
      related: ['post_install', 'plugin'],
    },
    {
      name: 'pre_integrate', platforms: ['podfile'],
      desc: { zh: '在项目写入磁盘前执行的钩子', en: 'Hook executed before the project is written to disk' },
      syntax: 'pre_integrate do |installer| ... end',
      options: [],
      examples: [
        { cmd: "pre_integrate do |installer|\n  # perform some changes on dependencies\nend", desc: { zh: '修改依赖', en: 'Modify dependencies' } },
      ],
      notes: { zh: '接收 Pod::Installer 作为唯一参数。', en: 'Receives the Pod::Installer as its only argument.' },
      related: ['post_integrate'],
    },
    {
      name: 'post_install', platforms: ['podfile'],
      desc: { zh: '在生成 Xcode 项目后、写入磁盘前执行的钩子', en: 'Hook executed after Xcode project generation but before writing to disk' },
      syntax: 'post_install do |installer| ... end',
      options: [],
      examples: [
        { cmd: "post_install do |installer|\n  installer.pods_project.targets.each do |target|\n    target.build_configurations.each do |config|\n      config.build_settings['SWIFT_VERSION'] = '5.0'\n    end\n  end\nend", desc: { zh: '修改构建设置', en: 'Modify build settings' } },
      ],
      notes: { zh: '最常用的钩子，用于自定义生成的 Xcode 项目的构建设置。接收 Pod::Installer 参数。', en: 'The most commonly used hook for customizing build settings of the generated Xcode project. Receives Pod::Installer.' },
      related: ['pre_install', 'post_integrate'],
    },
    {
      name: 'post_integrate', platforms: ['podfile'],
      desc: { zh: '在项目写入磁盘后执行的钩子', en: 'Hook executed after the project is written to disk' },
      syntax: 'post_integrate do |installer| ... end',
      options: [],
      examples: [
        { cmd: "post_integrate do |installer|\n  # some change after project write to disk\nend", desc: { zh: '项目写入后操作', en: 'Post-write operations' } },
      ],
      notes: { zh: '接收 Pod::Installer 作为唯一参数。', en: 'Receives the Pod::Installer as its only argument.' },
      related: ['pre_integrate', 'post_install'],
    },
  ];

  /* 去重（按名称，保留第一个） */
  var seen = {};
  COMMANDS = COMMANDS.filter(function (cmd) {
    if (seen[cmd.name]) return false;
    seen[cmd.name] = true;
    return true;
  });

  /* ========== DOM 引用 ========== */
  var $search = document.getElementById('cr-search');
  var $platforms = document.getElementById('cr-platforms');
  var $list = document.getElementById('cr-list');
  var $stats = document.getElementById('cr-stats');

  /* ========== 状态 ========== */
  var activePlatform = 'all';
  var expandedCard = null;

  /* ========== 初始化平台筛选 ========== */
  function initPlatforms() {
    if (!$platforms) return;
    var platforms = [
      { key: 'all', label: T('all-platforms') },
      { key: 'cli', label: T('platform-cli') },
      { key: 'dsl', label: T('platform-dsl') },
      { key: 'podfile', label: T('platform-podfile') },
    ];
    var html = '';
    platforms.forEach(function (p) {
      var cls = p.key === 'all' ? 'cr-platform-chip cr-active' : 'cr-platform-chip';
      html += '<button class="' + cls + '" data-platform="' + p.key + '">' + escapeHtml(p.label) + '</button>';
    });
    $platforms.innerHTML = html;

    $platforms.querySelectorAll('.cr-platform-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $platforms.querySelectorAll('.cr-platform-chip').forEach(function (b) { b.classList.remove('cr-active'); });
        btn.classList.add('cr-active');
        activePlatform = btn.getAttribute('data-platform');
        renderList();
      });
    });
  }

  /* ========== 渲染命令列表 ========== */
  function renderList() {
    var query = ($search && $search.value || '').toLowerCase().trim();
    var filtered = COMMANDS.filter(function (cmd) {
      /* 分类筛选 */
      if (activePlatform !== 'all' && cmd.platforms.indexOf(activePlatform) === -1) return false;
      /* 搜索 */
      if (!query) return true;
      var searchIn = (cmd.name + ' ' +
        (cmd.desc[LANG] || cmd.desc.en || '') + ' ' +
        cmd.options.map(function (o) { return o.flag + ' ' + (o.desc[LANG] || o.desc.en || ''); }).join(' ')).toLowerCase();
      return searchIn.indexOf(query) !== -1;
    });

    if ($stats) $stats.textContent = filtered.length + ' ' + T('commands-count');

    if (filtered.length === 0) {
      $list.innerHTML = '<div class="cr-empty">' +
        '<i class="fas fa-search"></i>' +
        '<div>' + escapeHtml(T('no-results')) + '</div>' +
        '<div style="font-size:0.85rem;margin-top:0.3rem;">' + escapeHtml(T('try-search')) + '</div>' +
        '</div>';
      return;
    }

    var html = '';
    filtered.forEach(function (cmd) {
      html += renderCard(cmd);
    });
    $list.innerHTML = html;

    /* 绑定卡片展开 */
    $list.querySelectorAll('.cr-card-header').forEach(function (header) {
      header.addEventListener('click', function () {
        var card = header.parentElement;
        var isOpen = card.classList.contains('cr-open');
        /* 关闭其他 */
        $list.querySelectorAll('.cr-card.cr-open').forEach(function (c) { c.classList.remove('cr-open'); });
        if (!isOpen) {
          card.classList.add('cr-open');
          expandedCard = card;
        } else {
          expandedCard = null;
        }
      });
    });

    /* 绑定复制按钮 */
    $list.querySelectorAll('.cr-copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var code = btn.getAttribute('data-cmd');
        if (code) {
          navigator.clipboard.writeText(code).then(function () {
            var orig = btn.textContent;
            btn.textContent = T('copied');
            setTimeout(function () { btn.textContent = orig; }, 1500);
          });
        }
      });
    });
  }

  function renderCard(cmd) {
    var badges = cmd.platforms.map(function (p) {
      return '<span class="cr-cmd-badge">' + escapeHtml(T('platform-' + p)) + '</span>';
    }).join('');

    /* 语法高亮 */
    var syntaxHtml = highlightSyntax(cmd.syntax);

    /* 参数表格 */
    var optsHtml = '';
    if (cmd.options && cmd.options.length) {
      optsHtml += '<div class="cr-section"><div class="cr-section-title">' + escapeHtml(T('options')) + '</div>';
      optsHtml += '<table class="cr-options-table"><thead><tr>' +
        '<th>' + escapeHtml(T('flag')) + '</th>' +
        '<th>' + escapeHtml(T('description')) + '</th></tr></thead><tbody>';
      cmd.options.forEach(function (opt) {
        var commonBadge = opt.common ? '<span class="cr-opt-common">' + escapeHtml(T('common')) + '</span>' : '';
        optsHtml += '<tr><td class="cr-opt-flag">' + escapeHtml(opt.flag) + commonBadge + '</td>' +
          '<td>' + escapeHtml(opt.desc[LANG] || opt.desc.en || '') + '</td></tr>';
      });
      optsHtml += '</tbody></table></div>';
    }

    /* 示例 */
    var examplesHtml = '';
    if (cmd.examples && cmd.examples.length) {
      examplesHtml += '<div class="cr-section"><div class="cr-section-title">' + escapeHtml(T('examples')) + '</div>';
      cmd.examples.forEach(function (ex) {
        examplesHtml += '<div class="cr-example">' +
          '<div class="cr-example-desc">' + escapeHtml(ex.desc[LANG] || ex.desc.en || '') + '</div>' +
          '<div class="cr-example-cmd"><code>' + escapeHtml(ex.cmd) + '</code>' +
          '<button class="cr-copy-btn" data-cmd="' + escapeHtml(ex.cmd) + '">' + escapeHtml(T('copy')) + '</button></div>' +
          '</div>';
      });
      examplesHtml += '</div>';
    }

    /* 注意事项 */
    var notesHtml = '';
    if (cmd.notes) {
      notesHtml = '<div class="cr-section"><div class="cr-section-title">' + escapeHtml(T('notes')) + '</div>' +
        '<div class="cr-note">' + escapeHtml(cmd.notes[LANG] || cmd.notes.en || '') + '</div></div>';
    }

    /* 相关命令 */
    var relatedHtml = '';
    if (cmd.related && cmd.related.length) {
      relatedHtml = '<div class="cr-section"><div class="cr-section-title">' + escapeHtml(T('related')) + '</div>' +
        '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;">' +
        cmd.related.map(function (r) {
          return '<span class="cr-cmd-badge" style="cursor:pointer;" data-related="' + escapeHtml(r) + '">' + escapeHtml(r) + '</span>';
        }).join('') + '</div></div>';
    }

    return '<div class="cr-card">' +
      '<div class="cr-card-header">' +
      '<span class="cr-cmd-name">' + escapeHtml(cmd.name) + '</span>' +
      '<span class="cr-cmd-desc">' + escapeHtml(cmd.desc[LANG] || cmd.desc.en || '') + '</span>' +
      '<span class="cr-cmd-platforms">' + badges + '</span>' +
      '<span class="cr-expand-icon"><i class="fas fa-chevron-right"></i></span>' +
      '</div>' +
      '<div class="cr-detail">' +
      '<div class="cr-section"><div class="cr-section-title">' + escapeHtml(T('syntax')) + '</div>' +
      '<div class="cr-syntax">' + syntaxHtml + '</div></div>' +
      optsHtml + examplesHtml + notesHtml + relatedHtml +
      '</div>' +
      '</div>';
  }

  /* 简单语法高亮 */
  function highlightSyntax(syntax) {
    return syntax
      .replace(/\[/g, '<span class="cr-comment">[</span>')
      .replace(/\]/g, '<span class="cr-comment">]</span>')
      .replace(/\{([^}]+)\}/g, '<span class="cr-opt">{$1}</span>')
      .replace(/\b([A-Z][A-Z_]+)\b/g, '<span class="cr-arg">$1</span>')
      .replace(/\b(\w+)\b/g, function (m, w) {
        if (['OPTIONS', 'FILE', 'DIRECTORY', 'PATH', 'HOST', 'USER', 'PORT', 'PATTERN', 'COMMAND', 'URL', 'DEST', 'SOURCE', 'MSG', 'NUM', 'SEC', 'MS', 'PID', 'MODE', 'SIZE', 'APP', 'BRANCH', 'DATA', 'VOICE', 'RATE', 'STAMP', 'COUNT', 'TYPE'].indexOf(w) !== -1) {
          return '<span class="cr-arg">' + w + '</span>';
        }
        return '<span class="cr-kw">' + w + '</span>';
      });
  }

  /* ========== 搜索事件 ========== */
  if ($search) {
    $search.addEventListener('input', function () {
      renderList();
    });
    $search.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        $search.value = '';
        renderList();
      }
    });
  }

  /* ========== 相关命令点击 ========== */
  if ($list) {
    $list.addEventListener('click', function (e) {
      var badge = e.target.closest('[data-related]');
      if (!badge) return;
      var name = badge.getAttribute('data-related');
      if ($search) {
        $search.value = name;
        renderList();
        /* 高亮目标卡片 */
        setTimeout(function () {
          var target = $list.querySelector('.cr-cmd-name');
          if (target) {
            var card = target.closest('.cr-card');
            if (card) {
              card.classList.add('cr-open');
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 50);
      }
    });
  }

  /* ========== 工具函数 ========== */
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ========== 启动 ========== */
  initPlatforms();
  renderList();

})();
