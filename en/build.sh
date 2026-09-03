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

echo "已经部署sunyazhou13.github.io,无需手动执行sunyazhou13.github.io目录下的push.sh脚本."
echo "同步到腾讯云服务器..."
if ssh -o BatchMode=yes -o ConnectTimeout=10 ubuntu@81.70.241.84 'cd /home/ubuntu/blog && git pull origin master'; then
    echo "服务器同步完成"
else
    echo "警告：服务器同步失败，GitHub Pages 已正常更新，可稍后手动运行以下命令重试："
    echo "  ssh ubuntu@81.70.241.84 'cd /home/ubuntu/blog && git pull origin master'"
fi