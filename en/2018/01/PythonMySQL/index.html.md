---
layout: post
title: Using Python to Operate the MySQL Database
date: 2018-01-13 22:27:18
categories: [系统理论实践]
tags: [python]
typora-root-url: ..
math: false
mermaid: false

---

![Mysql Python](/assets/images/20180113PythonMySQL/MysqlPython.avif)


# Preface

To realize `不斷學習 與時俱進` (keep learning, keep up with the times), I spent most of my weekends learning `Python`.
During my recent study, I've excerpted and organized some valuable parts and put them on the blog, so that when I forget them later, I can come back and browse the blog.

I learned from the course [《全栈数据工程师养成攻略》](http://study.163.com/course/courseMain.htm?courseId=1003520028) on `study.163.com`. I recommend everyone to study it.

## Main Contents of This Post

It is mainly divided into three major parts

1. Setting up a `Web` environment
2. How to use the MySQL database
3. Using Python to operate MySQL

### Setting up a `Web` environment

* Web environments: Apache, Nginx...
* Related configuration during Web service startup.

#### Web environments: Apache, Nginx...

Downloads for the two platforms

[MAMP](https://www.mamp.info/en/): Mac, Apache, MySQL, PHP 
> Mac, Apache, MySQL, PHP abbreviated as `MAMP`

[WAMP](https://www.mamp.info/en/): Windows, Apache, MySQL, PHP 
> Windows, Apache, MySQL, PHP abbreviated as `WAMP`

Of course there are also Linux versions; I won't go into detail here.

In short, you need to install this software to set up the environment.

Let me use `MAMP` as an example

![mamp](/assets/images/20180113PythonMySQL/mamp1.avif)

After opening it  
![mamp](/assets/images/20180113PythonMySQL/mamp2.avif)

#### Related configuration during Web service startup

Start the `Apache Server` and `MySQL Server` services (in the upper right corner).
Then click `Preferences` to configure the local port.

![mamp](/assets/images/20180113PythonMySQL/mamp3.avif)

There are two default configurations here (the part highlighted in red)

If you start the services, then open the browser and enter: `localhost:8888` to see the results
> localhost == 127.0.0.1

`8888` is the service port

The image below lets you choose the document root directory
![mamp](/assets/images/20180113PythonMySQL/mamp4.avif)

What does that mean?

It means that if you put the web page files into this folder,
you can browse them directly in the browser.

![mamp](/assets/images/20180113PythonMySQL/mamp2.avif)

In this image, in the middle is `Open Start Page`. 

![sql](/assets/images/20180113PythonMySQL/sql1.avif)


Enter the database configuration

Configure the database name
![sql](/assets/images/20180113PythonMySQL/sql2.avif)

Enter the table name

![sql](/assets/images/20180113PythonMySQL/sql3.avif)

Configure the database table
![sql](/assets/images/20180113PythonMySQL/sql4.avif)

After configuring, click Done on the right

### How to use the MySQL database

* Basic concepts
* Installing Python MySQL in the terminal
* Exporting and importing data with Navicat
* My personal habit and workflow

#### Basic concepts

`CURD` operations:

* `C` Create
* `R` Read
* `U` Update
* `D` Delete

These are the `create`, `delete`, `update`, and `query` operations in database knowledge

#### Installing Python MySQL in the terminal

Use the following command in the terminal to install the MySQL environment

``` sh
pip install MySQL-python
```
I got an error when installing

![Pip Install Mysql Python](/assets/images/20180113PythonMySQL/PipInstallMysqlPython.avif)

Finally, run

``` sh
brew install mysql-python
```
Then run `pip install MySQL-python` again

How to test whether it succeeded

Enter `python` in the shell

![pythonshell](/assets/images/20180113PythonMySQL/pythonshell1.avif)

Run

``` python
import MySQLdb

```

If there is no error, it's OK.


#### Exporting and importing data with Navicat

Please download this database visualization software yourself  
![navicat](/assets/images/20180113PythonMySQL/navicat1.avif)


After opening it, click New Connection in the upper left corner and select MySQL
![navicat](/assets/images/20180113PythonMySQL/navicat2.avif)

Then configure the database information
![navicat](/assets/images/20180113PythonMySQL/navicat3.avif)

The name here is the __database name__
For `host`, use local; if it's remote, fill in the `ip` or `url`  
For `port`, we set `8889` earlier  
Enter `root` for both the account and password (in the earlier screenshot you can already see that the account and password are the same)

Now connect to the database

![navicat](/assets/images/20180113PythonMySQL/navicat4.avif)


This image below shows

![navicat](/assets/images/20180113PythonMySQL/navicat5.avif)

__Database export and import; of course you can also export and import data tables.__



#### My personal habit and workflow

* Use `phpmyadmin` to create databases and data tables
* Use `python` to insert, read, update, and modify data
* Use `Navicat` to export the database
* Use `phpmyadmin` to import the database 

Finally, deploy (deloy) to production, which avoids various problems caused by incorrectly operating the database

### Using Python to operate MySQL

There's nothing special here, just the coding part. Before using it, click [here to download](https://github.com/sunyazhou13/blogfiles/blob/main/DoubanMovieClean.txt) this text file


We'll use `sublime text` to create a new `text.py` file


``` python
#!/usr/bin/env python
# coding:utf8

import sys
reload(sys)
sys.setdefaultencoding("utf8")

import MySQLdb
import MySQLdb.cursors
```

![Pythoncode](/assets/images/20180113PythonMySQL/Pythoncode1.avif)


> Note: _test.py is best kept in the same directory as douban_movie_clean.txt so that you don't have to write out the path_

Then create the database connection

``` python

db = MySQLdb.connect(host='127.0.0.1', user='root', passwd='root', db='douban', port=8889, charset='utf8', cursorclass=MySQLdb.cursors.DictCursor) //1
db.autocommit(True) //2
cursor = db.cursor() //3

fr = open('douban_movie_clean.txt','r') //4

fr.close() //4

cursor.close() //3
db.close() //1

```
> Note: remember to close `db` when done, and remember to close `cursor` too. `fr` is for file reading/writing and has nothing to do with the database, but remember to close it after use

Let me explain what this means

1. `db` creates the database instance, with input parameters `host` (here it's 127.0.0.1, can also be replaced with localhost), `passwd`, `db`, `port`, `charset`, `cursorclass`.
2. Auto-commit to finish updating the database
3. Get a connection `cursor` from the `db` instance; each time use `cursor.execute()` to run the create/delete/update/query SQL statements
4. Read the local text file

That's roughly what it means

#### Reading Data

``` python
# Create
# Read data
fr = open('douban_movie_clean.txt', 'r')

count = 0
for line in fr:
	count += 1
	# count indicates the current line being processed
	print count
	# Skip the header row
	if count == 1:
		continue

	# strip() removes whitespace from both ends of the string
	# split() splits the string into a list by the given separator
	line = line.strip().split('^')
	# Insert data, keeping the fields aligned
	# The first argument of execute() is the SQL command to run
	# A template is generated here using string formatting
	# %s is a placeholder
	# The second argument is the params to be formatted, passed into the template
	cursor.execute("insert into movie(title, url, rate, length, description) values(%s, %s, %s, %s, %s)", [line[1], line[2], line[4], line[-3], line[-1]])

# Close the read file
fr.close()
```

Use the `cursor` connection instance we obtained to run `cursor.execute()` for `sql` insert operations.

![Pythoncode](/assets/images/20180113PythonMySQL/Pythoncode2.avif)

Let's look at the result
![sqlresult](/assets/images/20180113PythonMySQL/sqlresult.avif)


#### Updating Data

To update data, for example, I want to update the `title` field and `length` of the record with id=1

``` python
# Update
cursor.execute("update movie set title=%s, length=%s where id=1", ['孙亚洲', 999])
```

#### Reading Data

``` python
# Read
cursor.execute("select title, length from movie where id=1")
movies = cursor.fetchone()
```

#### Deleting Data

``` python
# Delete
cursor.execute("delete from movie where id=%s",[2])
```

---

Let's look at the complete code below


``` python 
#!/usr/bin/env python
# coding:utf8

import sys
reload(sys)
sys.setdefaultencoding("utf8")


import MySQLdb
import MySQLdb.cursors

db = MySQLdb.connect(host='127.0.0.1', user='root', passwd='root', db='douban', port=8889, charset='utf8', cursorclass=MySQLdb.cursors.DictCursor)
db.autocommit(True)
cursor = db.cursor()

fr = open('douban_movie_clean.txt','r')

# Create
count = 0
for line in fr:
	count += 1
	print count
	if count == 1:
		continue
	line = line.strip().split('^')
	cursor.execute("insert into movie(title, url, rate, length, description) values(%s, %s, %s, %s, %s)", [line[1], line[2], line[4], line[-3], line[-1]])
fr.close()

# Update
cursor.execute("update movie set title=%s, length=%s where id=1", ['孙亚洲', 999])

# Read
cursor.execute("select title, length from movie where id=1")
movies = cursor.fetchone()

print len(movies)
# print movies[0]


# Delete

cursor.execute("delete from movie where id=%s",[2])


cursor.close()
db.close()
```


## Summary

Studying how to operate the database with `python` was very rewarding; it reminded me of how my college teacher, Li Yuehui, taught me to connect to a database with Java.
At work, we may encounter problems like how to insert a huge amount of data into a database. By learning the content of this chapter, you can easily handle batch data.

For more SQL statements 
refer to the [SQL Tutorial](http://www.runoob.com/sql/sql-tutorial.html)


End of article
