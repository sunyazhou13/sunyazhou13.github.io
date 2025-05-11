---
layout: post
title: 如何使用git管理代码
date: 2017-02-09 19:35:45
categories: [Git]
tags: [iOS, macOS, Git, skills]
typora-root-url: ..
---

![](/assets/images/20170209HowToUseGitManageCode/guide.webp)


# 全局配置git

--

``` sh
$ git config --global user.name "username"  
$ git config --global user.email "email@you.com"
```
> `username` 一般代表提交的本机用户名  
> `email@you.com` 一般是邮箱地址 


创建本地仓库进行初始化  
--

``` sh
$ git init  
```
> 执行完成之后在本地创建一个 .git 的隐藏文件夹包含git的信息在里面

克隆远程版本库
--

``` sh
$ git clone git@github.com:sunyazhou13/sunyazhou13.github.io.git
```

查看当前代码库状况
--

``` sh
$ git status
```
> `git status` 命令会显示当前代码库的状况，包括添加，修改（modified），删除（deleted）


版本管理
--

指向git当前最新版本为`HEAD`，`HEAD^`表示上一版本，`HEAD^^`上上一个版本，`HEAD~100`表示往上100个版本

添加本地修改代码
--

``` sh
//添加当前目录的所有修改
$ git add .  

```
> //如果需要添加指定文件可以这样  
> `$ git add  A B  C `  // 中间用空格隔开  
> //如果有些文件标红 代表未纳入git 管理 可以 `rm -rf xxx`删除该文件  
> //如果有些文件标黄 代表有修改  
> //如果有些文件标绿 代表有文件已经纳入 `git` 管理


提交
--

``` sh 
$ git commit -am "[产品名称][迭代名称] 1.修改点 2.修改点xxx"
	
```

push到`git`代码仓库
--

``` sh 
$ git push origin HEAD:refs/for/master
	
```
> 如果是第一次提交 使用 `git push -u origin master`

push 的时候进行代码追踪
--
``` sh
$ git push --set-upstream origin + 分支名
```


如果提交被废弃
--

``` sh
$ git fetch origin master
$ git reset --soft origin/master
$ git add .
$ git commit -m "some comments"
$ git push origin HEAD:refs/for/master
```
> 回到本地代码库库中，执行


分支管理
--

创建分支并切换过去
``` sh 
$ git branch -b 分支名
```

切换分支

``` sh 
$ git checkout 分支名
```
> 查看远程分支 `git branch -r` r 代表remote

合并分支
--

`$ git merge br-name`将`br-name`分支合并到当前分支下 
加入`--no-ff`则表示禁用Fast forward模式。即新建commit而不是切换HEAD指针来实现 
`$ git merge --no-ff -m "merge with no-ff" dev` 
合并分支前可以通过`git diff <source_branch> <target_branch>`来查看两者不同

合并冲突
--
merge分支时，如果两分支对同一地方做了不同的修改，则为冲突，冲突的文件git会生成如下内容

```
<<<<<<< HEAD 
Creating a new branch is quick & simple. 
======= 
Creating a new branch is quick AND simple. 
>>>>>>> feature1

```

解决完冲突 合并之后 记得执行

``` sh
$ git rebase --continue
```

强制更新 tag 到指定的 commit

``` sh
git tag --force v1.0.0 bc63359
git push --tags -f
```

> git ll 可以看到短版本号,如果不好使 请执行如下脚本然后重试


下面是常用的 git 别名


``` sh
git config --global alias.ll "log --graph --all --pretty=format:'%Cred%h %Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative" 
git config --global alias.co checkout 
git config --global alias.br branch 
git config --global alias.ci commit 
git config --global alias.st status 
git config --global alias.last 'log -1 HEAD' 
git config --global alias.df diff
git config --global alias.co checkout
```

[详细资料参考](https://www.zybuluo.com/ValenW/note/364756)


批量删除 本地分支

```
git branch | grep 'branchName' |xargs git branch -D
```
这个是通过 shell 管道命令来实现的批量删除分支的功能。
**grep**是对**git branch**的输出结果进行匹配，匹配值为**branchName**。
**xargs**的作用是将参数列表转换成小块分段传递给其他命令。
所以这个命令的意思就是
从分支列表中匹配到指定的分支，然后一个一个（分成小块）传递给删除分支的命令，最后进行删除。
从而达到批量删除分支的目的

例如:我想删除本地 以 5.8.开头的分支 我可以这样写

``` sh

git branch | grep '5.8.*' |xargs git branch -D

```

通过通配符即可

> 2018年9月30日更新

持续更新

git clean 清理掉不在git版本控制之内的文件  
--

``` sh
git clean -dfx  
```

> 2020.1.7 update


删除工程中总是放到ignore中跟踪不上小的xcode userdata

最近工程中总是出现下面这个文件 无论如何放gitignore总是不生效

``` sh
Crown.xcworkspace/xcuserdata/sunyazhou.xcuserdatad/UserInterfaceState.xcuserstate

```

下面看下正确的操作

` [project] `替换成你的工程 ` [username]  `替换成你的用户名

``` sh
git rm --cached [project].xcodeproj/project.xcworkspace/xcuserdata/[username].xcuserdatad/UserInterfaceState.xcuserstate
git commit -m "Removed file that shouldn't be tracked"
```
> 2022.12.2 更新自[Can't ignore UserInterfaceState.xcuserstate](https://stackoverflow.com/questions/6564257/cant-ignore-userinterfacestate-xcuserstate)


如果需要各种语言的ignore可以参考[A collection of useful .gitignore templates](https://github.com/github/gitignore)


# 合并多次提交

在 Git 中，`rebase` 命令用于将一系列提交从一个分支上移动到另一个分支上，同时保持提交的顺序和内容不变。`git rebase -i` 是一个交互式的变体，允许你对提交进行编辑。以下是如何使用 `git rebase -i HEAD~N` 来合并多次提交为一次提交的步骤：

1. **确定需要合并的提交数量**：
   - `HEAD~N` 表示从当前提交向前数 N 个提交。你需要确定 N 的值，即你想要合并的提交的数量。

2. **启动交互式变基**：
   - 打开终端或 Git Bash，并切换到你的 Git 仓库目录。
   - 输入 `git rebase -i HEAD~N` 并替换 N 为你确定的提交数量。

``` bash
git rebase -i HEAD~3
```
> 合并最近3次提交

3. **编辑提交列表**：
   - 这将打开一个文本编辑器，列出了从 `HEAD~N` 到当前 HEAD 的所有提交。
   - 你将看到每个提交前面都有一个 `pick` 命令。你可以通过编辑这些命令来决定如何处理每个提交。

4. **合并提交**：
   - 要合并提交，你需要将除了第一个提交之外的所有提交的 `pick` 改为 `squash` 或 `s`（`squash` 的简写）。这样，除了第一个提交外，其他所有提交都会被合并到第一个提交中。
   - 例如，如果你有以下提交列表：
   
     ``` bash
     pick 3f3f3f3 第一个提交信息
     pick 4b4b4b4 第二个提交信息
     pick 5c5c5c5 第三个提交信息
     ```
   
     你应该将它们修改为：
     
     ``` bash
     pick 3f3f3f3 第一个提交信息
     squash 4b4b4b4 第二个提交信息
     squash 5c5c5c5 第三个提交信息
     ```
	> pick作为最开始的基点

5. **编辑提交信息**：
   - 保存并关闭编辑器后，Git 会合并你选择的提交，并打开另一个编辑器让你编辑新的提交信息。
   - 你可以选择保留第一个提交的信息，或者编辑一个新的提交信息来总结所有合并的提交。

6. **完成变基**：
   - 保存并关闭提交信息编辑器，Git 将完成变基操作，并将你的提交历史更新为一个新的线性历史。

请注意，变基是一个破坏性操作，它会改变历史提交的哈希值。因此，只有在你确定不会影响其他人的工作时才应该使用它，特别是在公共分支上。如果你在团队中工作，最好在进行这样的操作之前与团队成员沟通。

# 大文件处理

``` sh
brew install git-lfs                                 # install via homebrew
git lfs install                                      # initialize lfs for yor repo
git lfs track ios-app/Frameworks/*.framework/**/*    # track all frameworks in your project.  *.xcframework
git add --all                                        # stage
git commit -m "Added files to git lfs"               # commit
git lfs ls-files
git push
```