---
title: "随机密码串生成"
date: 2025-07-09
---
# 随机密码串生成
## 背景
在使用linux中有时候，我们需要通过脚本批量的创建用户，并对其赋予不同的密码。这就需要我们获取随机的密码串。
在下面整理的3中不同的获取密码串的方式

## 方式1:通过时间来获取随机密码
```sh
passwd=$(date +%s%N | md5sum | cut -c 1-12)
```
但是此方法会有一个问题：获取到的密码可能会出现“abc”这种连续的字符串，很有可能不服和当前的安全策略，导致密码赋予失败

## 方式2：通过命令mkpasswd获取随机密码
- 前提：需要安装expect包(yum install expect)
```bash
passwd=$(mkpasswd -l 15 -d 5 -c 5 -C 3 -s 2)
```
```bash
#参数说明(其他信息还是要到系统中查看)：   
    The -l flag defines the length of the password.  The default is 9.  The following example creates a 20 character password.
    The -d flag defines the minimum number of digits that must be in the password.  The default is 2.  The following example creates a password with at least 3 digits.
    The -c flag defines the minimum number of lowercase alphabetic characters that must be in the password.  The default is 2.
    The -C flag defines the minimum number of uppercase alphabetic characters that must be in the password.  The default is 2.
    The -s flag defines the minimum number of special characters that must be in the password.  The default is 1.
    The -p flag names a program to set the password.  By default, /etc/yppasswd is used if present, otherwise /bin/passwd is used.
    The  -2  flag  causes characters to be chosen so that they alternate between right and left hands \(qwerty-style\), making it harder for anyone watching passwords being entered.  This can also make it easier for a password-guessing program.
    The -v flag causes the password-setting interaction to be visible.  By default, it is suppressed.
```

## 方式3：通过python代码实现随机密码的获取
```bash
passwd=$(python getRandompasswd.py)
```
通过对RandomPasswd实例化，可以指定获取到的密码的总长度，大小写字母的最少个数，特殊字符的最少个数，数字的最少个数。  
另外代码还限制了不会出现ascii码连续的三个字符。同时还可以修改此类中的列表，指定可以出现在密码串中的字符

- 具体实现代码
```Python
import random
import sys

class RandomPasswd:
    def __init__(self,passwd_len=15,min_num=3,min_letter=3,min_LETTER=3,min_char=3):
        self.min_num = min_num
        self.min_letter = min_letter
        self.min_LETTER = min_LETTER
        self.min_char = min_char
        self.passwd_len = passwd_len
        self.num_list = [chr(i) for i in range(48,58)]
        self.let_list = [chr(i) for i in range(97,123)]
        self.LET_list = [chr(i) for i in range(65,91)]
        self.char_list = ['!', '#']
        self.passwd=''

    def get_pass_set(self):
        if self.min_num+self.min_char+self.min_LETTER+self.min_letter > self.passwd_len:
            print "ERROR: If the minimum number of occurrences of each type is greater than the password length, set it again"
            sys.exit(1)
        pass_set_list=[]
        if self.min_num==0 and self.min_char==0 and self.min_LETTER==0 and self.min_letter==0 :
            pass_set_list=self.let_list+self.char_list+self.num_list+self.LET_list
        else:
            if self.min_num > 0:
                pass_set_list+=self.num_list
            if self.min_letter > 0:
                pass_set_list+=self.let_list
            if self.min_LETTER > 0:
                pass_set_list+=self.LET_list
            if self.min_char > 0:
                pass_set_list += self.char_list
        return pass_set_list

    def update_min_num(self,char):
        char = str(char)
        if char in self.LET_list and self.min_LETTER>0:
            self.min_LETTER-=1
        elif char in self.let_list and self.min_letter>0:
            self.min_letter-=1
        elif char in self.num_list and self.min_num>0:
            self.min_num-=1
        elif char in self.char_list and self.min_char>0:
            self.min_char-=1


    def check_char(self,char):
        char = str(char)
        if len(self.passwd)<=1:
            return True
        else:
            if ord(char)==ord(self.passwd[-1]) and ord(char)==ord(self.passwd[-2]):
                return False
            elif abs(ord(char)-ord(self.passwd[-1]))==1 and abs(ord(char)-ord(self.passwd[-2]))==2:
                return False
            else:
                return True

    def get_random_passwd(self):
        while self.passwd_len>0:
            pass_set_list = self.get_pass_set()
            # print(self.passwd)
            # print(pass_set_list)
            char = random.choice(pass_set_list)
            if self.check_char(char):
                self.passwd+=char
                self.update_min_num(char)
                self.passwd_len-=1
        return self.passwd


if __name__ == "__main__":
    a = RandomPasswd()
    password = a.get_random_passwd()
    print(password)
```