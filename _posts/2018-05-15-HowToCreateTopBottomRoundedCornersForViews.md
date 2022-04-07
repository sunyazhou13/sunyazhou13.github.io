---
title: UIView不同方向的导角
categories: [ios开发]
tags: [ios, macos]
date: 2018-05-15 09:58:00
---

![](/assets/images/20180515HowToCreateTopBottomRoundedCornersForViews/TopBottomCornerDemo.png)

# 前言

开发中总因为一些比较蛋疼的导角问题而困扰着我们,尤其是我们要给一个UIView导角成 左上 、左下。。。

这种需求很值得用代码实现一下, 今天突然在[AppCode](https://www.appcoda.com/rounded-corners-uiview/?utm_source=feedburner&utm_medium=feed&utm_campaign=Feed%3A+appcoda+%28AppCoda%3A+Your+iOS+Programming+Community%29)找到了一篇好文章.于是有了下文


## 通常导角



``` swift 
self.view.cornerRadius = 20.0
self.view.clipToBounds = true
```

这两行代码是全方向导角

如果像要搞成不同方向的话可以用iOS11 新的API和 iOS11以前的`CAShapeLayer`画贝赛尔曲线来解决

首先我们要创建一个UIView

``` swift
class ViewController: UIViewController {
    
    var cardView: UIView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        cardView = UIView()
        view.addSubview(cardView)
        cardView.translatesAutoresizingMaskIntoConstraints = false
        //把View居中
        cardView.widthAnchor.constraint(equalToConstant: 200).isActive = true
        cardView.heightAnchor.constraint(equalToConstant: 200).isActive = true
        cardView.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        cardView.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true
        cardView.backgroundColor = UIColor(red: 1.0, green: 0.784, blue: 0.2, alpha: 1)      
    }
}
```


iOS11 以后苹果提供了一个`UIView`的属性叫`maskedCorners`用于CALayer的动画相关.

``` swift
public struct CACornerMask : OptionSet {

    public init(rawValue: UInt)

    
    public static var layerMinXMinYCorner: CACornerMask { get }

    public static var layerMaxXMinYCorner: CACornerMask { get }

    public static var layerMinXMaxYCorner: CACornerMask { get }

    public static var layerMaxXMaxYCorner: CACornerMask { get }
}

```

下面我说一下

* layerMinXMinYCorner 底部右侧 的圆角 -> 右下角
* layerMaxXMinYCorner 顶部右侧 的圆角 -> 右上角
* layerMinXMaxYCorner 底部左侧 的圆角 -> 左下角
* layerMinXMinYCorner 顶部左侧 的圆角 -> 左上角



一般我们都为UIView写个 extension

``` swift
extension UIView {
    func roundCorners(cornerRadius: Double) {
        self.layer.cornerRadius = CGFloat(cornerRadius)
        self.clipsToBounds = true
        
        if #available(iOS 11.0, *) {
            self.layer.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
        } else {
            let path = UIBezierPath(roundedRect: self.bounds, byRoundingCorners: [.topLeft, .topRight], cornerRadii: CGSize(width: cornerRadius, height: cornerRadius))
            let maskLayer = CAShapeLayer()
            maskLayer.frame = self.bounds
            maskLayer.path = path.cgPath
            self.layer.mask = maskLayer
        }
        
    }
}
```

这里区分了iOS11之前和之后的两种搞法.

之前的话我们都是用一个贝塞尔曲线画path.然后创建CAShapeLayer 给self.layer.mask做一种透明的遮罩来解决不同方向导角问题.


## 添加动画效果的导角


我们在原ViewDidLoad()方法里面加个手势.

并写好触发的事件, 完整的代码如下

``` swift
import UIKit

class ViewController: UIViewController {
    
    var cardView: UIView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        cardView = UIView()
        view.addSubview(cardView)
        cardView.translatesAutoresizingMaskIntoConstraints = false
        cardView.widthAnchor.constraint(equalToConstant: 200).isActive = true
        cardView.heightAnchor.constraint(equalToConstant: 200).isActive = true
        cardView.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        cardView.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true
        cardView.backgroundColor = UIColor(red: 1.0, green: 0.784, blue: 0.2, alpha: 1)
        
        
        let tapRecognizer = UITapGestureRecognizer(target: self, action: #selector(animateCornerChange(recognizer:)))
        cardView.addGestureRecognizer(tapRecognizer)
        
    }

    
    
    @objc func animateCornerChange(recognizer: UITapGestureRecognizer) {
        let targetRadius: Double = (cardView.layer.cornerRadius == 0.0) ? 100.0:0.0
        
        if #available(iOS 10.0, *) {
            UIViewPropertyAnimator(duration: 0.4, curve: .easeInOut) {
                self.cardView.roundCorners(cornerRadius: targetRadius)
                }.startAnimation()
        } else {
            UIView.animate(withDuration: 1.0, delay: 0.0, options: .curveEaseInOut, animations: {
                
            }, completion: nil)
        }
    }
}

extension UIView {
    func roundCorners(cornerRadius: Double) {
        self.layer.cornerRadius = CGFloat(cornerRadius)
        self.clipsToBounds = true
        
        if #available(iOS 11.0, *) {
            self.layer.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
        } else {
            let path = UIBezierPath(roundedRect: self.bounds, byRoundingCorners: [.topLeft, .topRight], cornerRadii: CGSize(width: cornerRadius, height: cornerRadius))
            let maskLayer = CAShapeLayer()
            maskLayer.frame = self.bounds
            maskLayer.path = path.cgPath
            self.layer.mask = maskLayer
        }
        
    }
}
```

### 这里主要强调一下动画的新API

iOS10之后U增加一个新的动画效果API

``` swift
UIViewPropertyAnimator(duration: 0.4, curve: .easeInOut) {
//这里写相关View的操作代码 。。。eg:下面代码
                self.cardView.roundCorners(cornerRadius: targetRadius)
                }.startAnimation()
```

iOS之前可以通过古老的API来实现

``` swift
UIView.animate(withDuration: 1.0, delay: 0.0, options: .curveEaseInOut, animations: {
//这里写相关View的操作代码 。。。eg:下面代码
                self.cardView.roundCorners(cornerRadius: targetRadius)
            }, completion: nil)
```


最终的效果

![](/assets/images/20180515HowToCreateTopBottomRoundedCornersForViews/TopBottomCornerDemo.gif)



# 总结

iOS一些简单的动画导角比较常用所以记录下来,希望大家多多指教


[本文Demo](https://github.com/sunyazhou13/TopBottomCornerDemo)