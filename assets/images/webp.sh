#!/bin/sh

for dir in `ls .` 
do   
    if [ -d $dir ]   
    then     
        echo $dir     
        cd $dir     
            `for file in *.png *.jp*g *.PNG ; do cwebp -q 80 "$file" -o "${file%.*}.webp"; done`
            rm -rf *.png *.jp*g 
        cd ..   
    fi
done

#读取第一个参数
read_dir $1

#for file in *.png *.jp*g *.PNG ; do cwebp -q 80 "$file" -o "${file%.*}.webp"; done
