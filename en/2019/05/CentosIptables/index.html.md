---
layout: post
title: Installing the iptables Firewall on CentOS7
date: 2019-05-28 10:06:24
categories: [系统理论实践]
tags: [Linux, shell]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

Recently, my VPN (翻墙) kept being unstable. It turned out to be a firewall configuration problem. Let me record it today.


## Configuration

The default firewall on CentOS7 is not iptables, but firewalld.

Install iptable and iptable-services

``` sh
#First check whether iptables is installed
service iptables status
#Install iptables
yum install -y iptables
#Upgrade iptables
yum update iptables 
#Install iptables-services
yum install iptables-services

```


## Disable/Stop the built-in firewalld service

``` sh
#Stop the firewalld service
systemctl stop firewalld
#Disable the firewalld service
systemctl mask firewalld
```

## Set the existing rules

``` sh
#View existing iptables rules
iptables -L -n
#Allow everything first, otherwise it could end badly
iptables -P INPUT ACCEPT
#Flush all default rules
iptables -F
#Clear all custom rules
iptables -X
#Zero out all counters
iptables -Z
#Allow packets from the lo interface (local access)
iptables -A INPUT -i lo -j ACCEPT
#Open port 22
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
#Open port 21 (FTP)
iptables -A INPUT -p tcp --dport 21 -j ACCEPT
#Open port 80 (HTTP)
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
#Open port 443 (HTTPS)
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
#Allow ping
iptables -A INPUT -p icmp --icmp-type 8 -j ACCEPT
#Allow returning data RELATED to local requests; set for FTP
iptables -A INPUT -m state --state  RELATED,ESTABLISHED -j ACCEPT
#Drop all other inbound traffic
iptables -P INPUT DROP
#Allow all outbound traffic
iptables -P OUTPUT ACCEPT
#Drop all forwarding
iptables -P FORWARD DROP
```

## Other rule settings

``` sh
#To add a trusted internal IP (accept all its TCP requests)
iptables -A INPUT -p tcp -s 45.96.174.68 -j ACCEPT
#Drop all requests not matching the rules above
iptables -P INPUT DROP
#To ban an IP, use the following command:
iptables -I INPUT -s ***.***.***.*** -j DROP
#To unban an IP, use the following command:
iptables -D INPUT -s ***.***.***.*** -j DROP

```

## Save the rule settings

``` sh
#Save the rules above
service iptables save
```

## Enable the iptables service 

``` sh
#Register the iptables service
#Equivalent to the old chkconfig iptables on
systemctl enable iptables.service
#Start the service
systemctl start iptables.service
#Check the status
systemctl status iptables.service
```

## Solving the problem of vsftpd failing to use passive mode after iptables is enabled

1.First, modify or add the following content in /etc/sysconfig/iptables-config

``` sh
#Add the following; note the order must not be swapped
IPTABLES_MODULES="ip_conntrack_ftp"
IPTABLES_MODULES="ip_nat_ftp"

```

2.Reconfigure the iptables settings

``` sh
iptables -A INPUT -m state --state  RELATED,ESTABLISHED -j ACCEPT

```

### The complete setup script below

``` sh
#!/bin/sh
iptables -P INPUT ACCEPT
iptables -F
iptables -X
iptables -Z
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 21 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p icmp --icmp-type 8 -j ACCEPT
iptables -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -P INPUT DROP
iptables -P OUTPUT ACCEPT
iptables -P FORWARD DROP
service iptables save
systemctl restart iptables.service
```
