#!/bin/sh
./tools/build.sh
rm _site/config.codekit3 _site/build.sh _site/Brewfile _site/Brewfile.lock.json
rsync -auv _site/ ../sunyazhou13.github.io

pushd `pwd`
cd ../sunyazhou13.github.io
echo "当前目录脚本执行目录`pwd`"
echo "即将推送目标仓库:`git remote -v`"
sh push.sh 
echo "Done!"
popd