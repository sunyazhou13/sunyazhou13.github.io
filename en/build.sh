#!/bin/sh

# 让 bundle exec jekyll 找得到 RVM gemset。
# 非交互 / 新开的终端里 RVM 常常没初始化，GEM_PATH 只剩 ruby 自带目录，
# 于是 tools/build.sh 里的 `bundle exec jekyll b` 会报 Bundler::GemNotFound
# （"Could not find jekyll-4.4.1, jekyll-polyglot-1.14.0, ... in locally installed gems"）。
# 这里按当前 ruby 版本把 gemset 补进 GEM_PATH；已经设置好的终端不重复覆盖。
RUBY_GEMS_DIR="$(ruby -e 'print Gem.default_dir')"
GEMSET_DIR="$HOME/.rvm/gems/ruby-$(ruby -e 'print RUBY_VERSION')"
if [ -d "$GEMSET_DIR" ]; then
  [ -n "${GEM_HOME:-}" ] || export GEM_HOME="$GEMSET_DIR"
  case ":${GEM_PATH:-}:" in
    *":$GEMSET_DIR:"*) ;;
    *) export GEM_PATH="$GEMSET_DIR:${GEMSET_DIR}@global:$RUBY_GEMS_DIR${GEM_PATH:+:$GEM_PATH}" ;;
  esac
fi

./tools/build.sh
rm -f _site/config.codekit3 _site/build.sh _site/Brewfile _site/Brewfile.lock.json

# --delete 不能省。
# macOS 主盘是大小写不敏感的：_posts 里把文件改名（尤其是只改大小写，
# 例如 finalsummary.md -> Finalsummary.md）后，_site 会生成 Finalsummary/，
# 但部署仓里已经存在的 finalsummary/ 目录会被 rsync 当成同一个目录，
# 结果是「只更新里面的内容、目录名一个字都不变」。于是 git 看不到 rename，
# 线上 URL 也不会变 —— 表现出来就是「明明改了文件名，怎么不更新」。
# 加 --delete 后会先清掉目标里源中不存在的旧路径，再按源的真实大小写重建。
# exclude 用来保护部署仓自己的东西，尤其 .github（GitHub Pages 部署流水线，
# 被 rsync 删掉后 push 就再也不会触发部署了）。
rsync -auv --delete \
  --exclude='.git/' \
  --exclude='.github/' \
  --exclude='.gitignore' \
  --exclude='push.sh' \
  --exclude='.DS_Store' \
  _site/ ../sunyazhou13.github.io

pushd `pwd`
cd ../sunyazhou13.github.io
echo "当前目录脚本执行目录`pwd`"
echo "即将推送目标仓库:`git remote -v`"
sh push.sh 
echo "Done!"
popd

echo "已经部署sunyazhou13.github.io,无需手动执行sunyazhou13.github.io目录下的push.sh脚本."