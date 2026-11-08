---
layout: post
title: (Reproduced) Deep Dive into NSURLProtocol
date: 2020-03-20 11:34:22
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

![NSURL Protocol](/assets/images/20200320NSURLProtocol/NSURLProtocol.avif)

# Preface

This article is reproduced with authorization from the WeChat `知识小集 ` official account and originally from [FiTeen Blog](https://blog.fiteen.top/2020/hijacking-webview-request-with-nsprotocol). If there are copyright issues, please contact me at sunyazhou13@163.com. The purpose of reproducing this article is to record important knowledge points in iOS development, to prevent the original blog from being hard to find.

This article contains strong personal opinions. If you find it uncomfortable to read, please close it immediately. This article is for personal learning records only. You are welcome to reproduce or share it within the scope of the license agreement. Please respect copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thank you for your support!


## What is NSURLProtocol

NSURLProtocol is part of the [URL Loading System](https://developer.apple.com/documentation/foundation/url_loading_system?language=objc) in the Foundation framework. It allows developers to change all the details of URL loading without modifying the original request code in the app. In other words, NSURLProtocol is an Apple-sanctioned man-in-the-middle attack.

Although NSURLProtocol is called `Protocol`, it is not a protocol but an **abstract class**.

Since NSURLProtocol is an abstract class, it cannot be instantiated. So how does it implement network request interception?

The answer is through **subclassing** to define new or existing URL loading behaviors. If the current network request can be intercepted, the developer only needs to register a custom NSURLProtocol subclass with the app, and all requests can be intercepted and modified in this subclass.

So which network requests can be intercepted?

## NSURLProtocol Use Cases

As mentioned earlier, NSURLProtocol is part of the URL Loading System, so it can intercept all network requests based on the URL Loading System:

* NSURLSession  
* NSURLConnection  
* NSURLDownload    
* NSURLResponse    
	* NSHTTPURLResponse  
* NSURLRequest  
	* NSMutableURLRequest  

Correspondingly, network requests from third-party networking frameworks built on top of these, such as [AFNetworking](https://github.com/AFNetworking/AFNetworking) and [Alamofire](https://github.com/Alamofire/Alamofire), can also be intercepted by NSURLProtocol.

However, earlier implementations based on CFNetwork, such as [ASIHTTPRequest](https://github.com/pokeb/asi-http-request), cannot have their network requests intercepted.

Additionally, **UIWebView can also be intercepted by NSURLProtocol, but WKWebView cannot.** (Because WKWebView is based on WebKit and does not use C sockets.)

Therefore, in practice, it is very powerful. For example:

* Redirecting network requests to solve DNS domain hijacking issues
* Applying global or local network request settings, such as modifying request URLs, headers, etc.
* Ignoring network requests and using H5 offline packages or cached data
* Customizing network request response results, such as filtering sensitive information

Let's take a look at the relevant methods of NSURLProtocol.

## NSURLProtocol's Relevant Methods

### Creating Protocol Objects

``` objc
// Create a URL protocol instance to handle the request
- (instancetype)initWithRequest:(NSURLRequest *)request cachedResponse:(NSCachedURLResponse *)cachedResponse client:(id<NSURLProtocolClient>)client;
// Create a URL protocol instance to handle a session task request
- (instancetype)initWithTask:(NSURLSessionTask *)task cachedResponse:(NSCachedURLResponse *)cachedResponse client:(id<NSURLProtocolClient>)client;

```

### Registering and Unregistering Protocol Classes

``` objc
// Attempt to register an NSURLProtocol subclass to make it visible in the URL loading system
+ (BOOL)registerClass:(Class)protocolClass;
// Unregister the specified NSURLProtocol subclass
+ (void)unregisterClass:(Class)protocolClass;

```

### Determining Whether a Subclass Can Handle a Request  

The primary task when subclassing NSProtocol is to tell it what type of network requests to control.

``` objc
// Determine whether the protocol subclass can handle the specified request. If YES, the request will be controlled by it. If NO, it skips to the next protocol
+ (BOOL)canInitWithRequest:(NSURLRequest *)request;
// Determine whether the protocol subclass can handle the specified task request
+ (BOOL)canInitWithTask:(NSURLSessionTask *)task;
```

### Getting and Setting Request Properties

NSURLProtocol allows developers to get, add, and delete any metadata of a request object. These methods are commonly used to handle infinite loop issues with requests.

``` objc
// Get the property associated with the specified key in the specified request
+ (id)propertyForKey:(NSString *)key inRequest:(NSURLRequest *)request;
// Set the property associated with the specified key in the specified request
+ (void)setProperty:(id)value forKey:(NSString *)key inRequest:(NSMutableURLRequest *)request;
// Remove the property associated with the specified key in the specified request
+ (void)removePropertyForKey:(NSString *)key inRequest:(NSMutableURLRequest *)request;
```


### Providing a Canonical Version of a Request

If you want to modify a request in a specific way, you can use the following method.

``` objc
// Return a canonical version of the specified request
+ (NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request;
```

### Determining Whether Requests Are Equivalent

``` objc
// Determine whether two requests are equivalent. If they are, cached data can be used. Typically, just call the parent class implementation.
+ (BOOL)requestIsCacheEquivalent:(NSURLRequest *)a toRequest:(NSURLRequest *)b;

```

### Starting and Stopping Loading

These are the two most important methods in a subclass. Different custom subclasses pass different content when calling these methods, but the common point is that they all revolve around the `protocol` client.

``` objc
// Start loading
- (void)startLoading;  
// Stop loading  
- (void)stopLoading; 
```

### Getting Protocol Properties

``` objc
// Get the cache of the protocol receiver
- (NSCachedURLResponse *)cachedResponse;
// The object used by the receiver to communicate with the URL loading system. Each NSProtocol subclass instance has one
- (id<NSURLProtocolClient>)client;
// The receiver's request
- (NSURLRequest *)request;
// The receiver's task
- (NSURLSessionTask *)task;
```

NSURLProtocol in practice mainly accomplishes two things: intercepting URLs and forwarding URLs. Let's first look at how to intercept network requests.

## How to Intercept Network Requests with NSProtocol

### Creating an NSURLProtocol Subclass

Here we create a subclass named `HTCustomURLProtocol`.

``` objc
@interface HTCustomURLProtocol : NSURLProtocol
@end
```

### Registering an NSURLProtocol Subclass

Register this subclass at an appropriate location. For network requests based on NSURLConnection or created using `[NSURLSession sharedSession]`, simply call the `registerClass` method.

``` objc
[NSURLProtocol registerClass:[NSClassFromString(@"HTCustomURLProtocol") class]];
// Or
// [NSURLProtocol registerClass:[HTCustomURLProtocol class]];
```

If you need global monitoring, you can set it in the `didFinishLaunchingWithOptions:` method of `AppDelegate.m`. If you only need to use it in a single UIViewController, remember to unregister at the appropriate time:

``` objc
[NSURLProtocol unregisterClass:[NSClassFromString(@"HTCustomURLProtocol") class]];
```

If using NSURLSession-based network requests that are not created via `[NSURLSession sharedSession]`, you need to configure the `protocolClasses` property of the NSURLSessionConfiguration object.

``` objc
NSURLSessionConfiguration *sessionConfiguration = [NSURLSessionConfiguration defaultSessionConfiguration];
sessionConfiguration.protocolClasses = @[[NSClassFromString(@"HTCustomURLProtocol") class]];
```

### Implementing the NSURLProtocol Subclass

Implementing the subclass involves five steps:

> Register → Intercept → Forward → Callback → Finish

Taking UIWebView interception as an example, here we need to override these five core methods from the parent class.

``` objc
// Define a protocol key
static NSString * const HTCustomURLProtocolHandledKey = @"HTCustomURLProtocolHandledKey";

// Define an NSURLConnection property in the extension. NSURLSession can also be used for interception; here we just use NSURLConnection as an example.
@property (nonatomic, strong) NSURLConnection *connection;
// Define a mutable request return value
@property (nonatomic, strong) NSMutableData *responseData;

// Method 1: Called after intercepting a network request. You can further process the interception logic here, such as setting it to only handle http and https requests.
+ (BOOL)canInitWithRequest:(NSURLRequest *)request {
    // Only handle http and https requests
    NSString *scheme = [[request URL] scheme];
    if ( ([scheme caseInsensitiveCompare:@"http"] == NSOrderedSame ||
          [scheme caseInsensitiveCompare:@"https"] == NSOrderedSame)) {
        // Check if already handled, to prevent infinite loops
        if ([NSURLProtocol propertyForKey:HTCustomURLProtocolHandledKey inRequest:request]) {
            return NO;
        }
        // If you also need to intercept links in DNS resolution requests, you can add further checks here for whether it's a request to a domain being intercepted. If so, return NO
        return YES;
    }
    return NO;
}

// Method 2: [Key Method] You can process the request here, such as modifying the URL, extracting request information, setting request headers, etc.
+ (NSURLRequest *) canonicalRequestForRequest:(NSURLRequest *)request {
    // Can print all request URLs including CSS and Ajax requests
    NSLog(@"request.URL.absoluteString = %@",request.URL.absoluteString);
    NSMutableURLRequest *mutableRequest = [request mutableCopy];
    return mutableRequest;
}

// Method 3: [Key Method] Set up the network proxy here, create a new object to forward the processed request. The corresponding callback methods correspond to the <NSURLProtocolClient> protocol methods
- (void)startLoading {
    // Can modify the request
    NSMutableURLRequest *mutableRequest = [[self request] mutableCopy];
    // Tag to prevent recursive calls
    [NSURLProtocol setProperty:@YES forKey:HTCustomURLProtocolHandledKey inRequest:mutableRequest];
    // Can also check cache here
    // Forward the request — for NSURLConnection, create an NSURLConnection object; for NSURLSession, start an NSURLSessionTask
    self.connection = [NSURLConnection connectionWithRequest:mutableRequest delegate:self];
}

// Method 4: Mainly determines whether two requests are the same. If they are the same, cached data can be used. Typically just call the parent class implementation.
+ (BOOL)requestIsCacheEquivalent:(NSURLRequest *)a toRequest:(NSURLRequest *)b {
    return [super requestIsCacheEquivalent:a toRequest:b];
}

// Method 5: After processing is complete, stop the corresponding request and clean up the connection or session
- (void)stopLoading {
    if (self.connection != nil) {
        [self.connection cancel];
        self.connection = nil;
    }
}

// Based on the custom requirements made above, handle callbacks for the forwarded request at the appropriate time.
#pragma mark- NSURLConnectionDelegate

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error {
    [self.client URLProtocol:self didFailWithError:error];
}

#pragma mark - NSURLConnectionDataDelegate

// Called when receiving a response from the server (connected to the server)
- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response {
    self.responseData = [[NSMutableData alloc] init];
    // Can handle different statusCode scenarios
    // NSInteger statusCode = [(NSHTTPURLResponse *)response statusCode];
    // Can set Cookie
    [self.client URLProtocol:self didReceiveResponse:response cacheStoragePolicy:NSURLCacheStorageNotAllowed];
}

// Called when receiving data from the server. May be called multiple times, each time passing only partial data
- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data {
    [self.responseData appendData:data];
    [self.client URLProtocol:self didLoadData:data];
}

// Called when the server data loading is complete
- (void)connectionDidFinishLoading:(NSURLConnection *)connection {
    [self.client URLProtocolDidFinishLoading:self];
}

// Called when a request error (failure) occurs, such as request timeout, network disconnection, generally refers to client errors
- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error {
    [self.client URLProtocol:self didFailWithError:error];
}
```

Some NSURLProtocolClient methods used above:

``` objc
@protocol NSURLProtocolClient <NSObject>
// Request redirect
- (void)URLProtocol:(NSURLProtocol *)protocol wasRedirectedToRequest:(NSURLRequest *)request redirectResponse:(NSURLResponse *)redirectResponse;
// Whether the cached response is valid
- (void)URLProtocol:(NSURLProtocol *)protocol cachedResponseIsValid:(NSCachedURLResponse *)cachedResponse;
// Just received response information
- (void)URLProtocol:(NSURLProtocol *)protocol didReceiveResponse:(NSURLResponse *)response cacheStoragePolicy:(NSURLCacheStoragePolicy)policy;
// Data loaded successfully
- (void)URLProtocol:(NSURLProtocol *)protocol didLoadData:(NSData *)data;
// Data finished loading
- (void)URLProtocolDidFinishLoading:(NSURLProtocol *)protocol;
// Data loading failed
- (void)URLProtocol:(NSURLProtocol *)protocol didFailWithError:(NSError *)error;
// Start authentication for the specified request
- (void)URLProtocol:(NSURLProtocol *)protocol didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge;
// Cancel authentication for the specified request
- (void)URLProtocol:(NSURLProtocol *)protocol didCancelAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge;
@end
```

## Supplementary Content

### Things to Note When Using NSURLSession

If you use NSURLSession within NSURLProtocol, note:

* The HTTPBody of the intercepted request will be nil, but you can use HTTPBodyStream to get the body;

* If you register using `registerClass`, you can only create network requests via `[NSURLSession sharedSession]`.

### Registering Multiple NSURLProtocol Subclasses

When multiple custom NSURLProtocol subclasses are registered in the system, the URL loading process will be called in the reverse order of their registration — meaning the last registered NSURLProtocol will be checked first.

For cases where registration is done by configuring the `protocolClasses` property of the NSURLSessionConfiguration object, only the first NSURLProtocol in the `protocolClasses` array will take effect; subsequent NSURLProtocols cannot intercept.

So [OHHTTPStubs](https://github.com/AliSoftware/OHHTTPStubs) handles it this way when registering NSURLProtocol subclasses:

``` objc
+ (void)setEnabled:(BOOL)enable forSessionConfiguration:(NSURLSessionConfiguration*)sessionConfig
{
    // Runtime check to make sure the API is available on this version
    if ([sessionConfig respondsToSelector:@selector(protocolClasses)]
        && [sessionConfig respondsToSelector:@selector(setProtocolClasses:)])
    {
        NSMutableArray * urlProtocolClasses = [NSMutableArray arrayWithArray:sessionConfig.protocolClasses];
        Class protoCls = HTTPStubsProtocol.class;
        if (enable && ![urlProtocolClasses containsObject:protoCls])
        {
            // Insert own NSURLProtocol at the first position of protocolClasses for interception
            [urlProtocolClasses insertObject:protoCls atIndex:0];
        }
        else if (!enable && [urlProtocolClasses containsObject:protoCls])
        {
            // Remove after interception is complete
            [urlProtocolClasses removeObject:protoCls];
        }
        sessionConfig.protocolClasses = urlProtocolClasses;
    }
    else
    {
        NSLog(@"[OHHTTPStubs] %@ is only available when running on iOS7+/OSX9+. "
              @"Use conditions like 'if ([NSURLSessionConfiguration class])' to only call "
              @"this method if the user is running iOS7+/OSX9+.", NSStringFromSelector(_cmd));
    }
}
```

## How to Intercept WKWebView

Although NSURLProtocol cannot directly intercept WKWebView, there is still a solution. That is to use `WKBrowsingContextController` and `registerSchemeForCustomProtocol`.

``` objc
// Register scheme
Class cls = NSClassFromString(@"WKBrowsingContextController");
SEL sel = NSSelectorFromString(@"registerSchemeForCustomProtocol:");
if ([cls respondsToSelector:sel]) {
    // Requests via http and https; similarly, other schemes can be used but must conform to the URL Loading System
    [cls performSelector:sel withObject:@"http"];
    [cls performSelector:sel withObject:@"https"];
}
```
However, since this involves private methods, directly referencing it will not pass Apple's App Store review. So when using it, you need to process the strings, such as encrypting the method name with an algorithm. In practice, it can pass the review.

All in all, NSURLProtocol is very powerful. Whether optimizing app performance or extending functionality, it offers a lot of flexibility. However, while using it, you should also pay attention to the issues it brings. Although it has been applied in many frameworks and well-known projects, its essence is still worth exploring by developers.


# Summary

I carefully read the author's article and strongly recommend that iOS developers study it.
