---
layout: post
title: "Linux Terminal Bash Shortcut Keys: Introduction and Experience"
date: 2018-07-18 09:29:39
categories: [Linux]
tags: [系统理论实践, macOS, skills]
typora-root-url: ..
math: false
mermaid: false

---

![20130520Linux Logo On Centos](/assets/images/20180718LinuxBash/20130520LinuxLogoOnCentos5.avif)


# bash and its features

* [bash](http://cn.linux.vbird.org/linux_basic/0320bash.php) is essentially an executable program — a user's working environment.
* Under each shell you can open another shell; the newly opened shell can be called a subshell, and each shell is independent of the others.
* You can use the `pstree` command to view the number of subshells under the current shell.

### 1. The most important: auto-completion

| Command | Description |
| ----- | ----- |
| Tab | Auto-completion |

### 2. Editing and navigation

| Command | Description |
| ----- | ----- |
| Ctrl + A | Jump to the beginning of the current line |
|Ctrl + E | Jump to the end of the current line |
|Alt + F | Move the cursor forward one word on the current line |
|Alt + B | Move the cursor backward one word on the current line |
|Ctrl + W | Delete the word before the current cursor |
|Ctrl + K | Delete the content after the current cursor |
|Ctrl + U | Clear the entire line |
|Ctrl + L | Clear the screen, similar to the clear command |
|Ctrl + H | Backspace, similar to the backspace key |
|Ctrl + T | Swap the two characters before the current cursor |
|Esc + T | Swap the two words before the current cursor |

`Ctrl + W` and `Ctrl + U` are quite commonly used. Typos are a very common occurrence.

`Ctrl + L` goes without saying.

### 3. Process-related

| Command | Description |
| ----- | ----- |
| Ctrl + C | Terminate the current process |
| Ctrl + Z | Suspend the current process in the background
| Ctrl + D | Exit the current Shell, similar to the exit command |


`Ctrl + C` sends the SIGINT signal to the currently running process, terminating it.

> SIGINT - This signal is the same as pressing ctrl-c. On some systems, "delete" + "break" sends the same signal to the process. The process is interrupted and stopped. However, the process can ignore this signal.


`Ctrl + Z` doesn't end the process; it suspends it in the background. You can later resume it with the `fg` command. The corresponding signal is SIGTSTP.

### 3. Searching commands you've used (highly recommended)

| Command | Description |
| ----- | ----- |
| Ctrl + R | Used to search for previously used commands |

I often use `history` to view command history, but there's already a ready-made shortcut for it.

After pressing `Ctrl + R`, type the keyword to search for; if it's not the one you want, keep pressing `Ctrl + R` to iterate through the matches.

This command actually queries through the `history` records as well. If you don't like this approach, you can just do `history | grep xxx`, which works just as well.


[Reference: Linux公社](https://www.linuxidc.com/Linux/2017-11/148262.htm)



# Summary

These commands noticeably improve work efficiency and need to be reviewed and memorized repeatedly. At the end of this post, I'd like to recommend `Linux公社` (LinuxFans), a Linux community with a sense of history and humanism, from which I've learned quite a lot.



