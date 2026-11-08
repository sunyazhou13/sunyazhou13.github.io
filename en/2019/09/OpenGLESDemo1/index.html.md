---
layout: post
title: Learning OpenGLES Texture Rendering from Scratch
date: 2019-09-06 10:19:48
categories: [iOS]
tags: [iOS, macOS, Objective-C, OpenGL, 图形图象, 音视频]
typora-root-url: ..
math: false
mermaid: false

---


![sunyazhou_logo_glsl](/assets/images/20190906OpenGLESDemo1/sunyazhou_logo_glsl.avif)


# Preface

It's been a long time since I used OpenGL. This post records my notes on learning GLSL code and its implementation.


## Objective-C Code


``` objc
#import "ViewController.h"
#import <GLKit/GLKit.h>

//vertex struct type
typedef struct {
    GLKVector3 positionCoord; // (x,y,z)
    GLKMatrix2 textureCoord; // (u, v)
    
} SenceVertex;


@interface ViewController ()

@property (nonatomic, assign) SenceVertex *vertices; //顶点数组
@property (nonatomic, strong) EAGLContext *context;

@end

@implementation ViewController

#pragma mark -
#pragma mark - override methods
- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = [UIColor whiteColor];
    [self commonInit];
}

#pragma mark -
#pragma mark - private methods
- (void)commonInit {
    //create the context, using version 2.0
    self.context = [[EAGLContext alloc] initWithAPI:kEAGLRenderingAPIOpenGLES2];
    [EAGLContext setCurrentContext:self.context];
    
    //create the vertex array
    self.vertices = malloc(sizeof(SenceVertex) * 4); //4个顶点
    {% raw %}
    self.vertices[0] = (SenceVertex){{-1, 1, 0},{ 0, 1 }}; //左上角
    self.vertices[1] = (SenceVertex){{-1, -1, 0},{0 ,0}}; //左下角
    self.vertices[2] = (SenceVertex){{1, 1, 0},{1, 1}}; //右上角
    self.vertices[3] = (SenceVertex){{1, -1, 0},{1, 0}}; //右下角
    {% endraw %}
    //create a layer for displaying the texture
    
    CAEAGLLayer *layer = [CAEAGLLayer layer];
    layer.frame = CGRectMake(0, 100, self.view.frame.size.width, self.view.frame.size.width);
    layer.contentsScale = [[UIScreen mainScreen] scale]; //设置缩放比例，不设置的话，纹理会失真
    
    [self.view.layer addSublayer:layer];
    
    //bind the texture to the output layer
    [self bindRenderLayer:layer];
    
    //load the texture
    NSString *imagePath = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:@"logo.avif"];
    UIImage *image = [UIImage imageWithContentsOfFile:imagePath];
    GLuint textureID = [self createTextureWithImage:image];
    
    
    //set the viewport size
    
    glViewport(0, 0, self.drawableWidth, self.drawableHeight);
    
    //compile and link the shaders
    GLuint program = [self programWithShaderName:@"glsl"];
    glUseProgram(program);
    
    //get the parameters from the shader and pass data into them
    GLuint positionSlot = glGetAttribLocation(program, "Position"); //获取顶点着色器的位置
    GLuint textureCoordsSlot = glGetAttribLocation(program, "TextureCoords"); //获取顶点着色器中的纹理坐标

    GLuint textureSlot = glGetUniformLocation(program, "Texture"); //获取片元着色器纹理变量

    //pass the texture ID to the shader program
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, textureID);
    glUniform1i(textureSlot, 0); // 将textureSlot 赋值为 0, 而 0 与 GL_TEXTURE0 对应,这里如果写1,就是GL_TEXTURE1
    
    //create the vertex buffer
    GLuint vertexBuffer;
    glGenBuffers(1, &vertexBuffer);
    glBindBuffer(GL_ARRAY_BUFFER, vertexBuffer);
    GLsizeiptr bufferSizeBytes = sizeof(SenceVertex) * 4;
    glBufferData(GL_ARRAY_BUFFER, bufferSizeBytes, self.vertices, GL_STATIC_DRAW);
    
    //set the vertex data
    glEnableVertexAttribArray(positionSlot);
    glVertexAttribPointer(positionSlot, 3, GL_FLOAT, GL_FALSE, sizeof(SenceVertex), NULL + offsetof(SenceVertex, positionCoord));
    
    //set the texture data
    glEnableVertexAttribArray(textureCoordsSlot);
    glVertexAttribPointer(textureCoordsSlot, 2, GL_FLOAT, GL_FALSE, sizeof(SenceVertex), NULL + offsetof(SenceVertex, textureCoord));
    
    //start drawing
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
    
    //present the renderbuffer
    [self.context presentRenderbuffer:GL_RENDERBUFFER];
    
    //delete the vertex buffer
    glDeleteBuffers(1, &vertexBuffer);
    vertexBuffer = 0;
    
}

//bind the layer where the image will be rendered
- (void)bindRenderLayer:(CALayer <EAGLDrawable> *)layer {
    GLuint frameBuffer; //帧缓冲
    GLuint renderBuffer; //渲染缓冲

    //bind the renderbuffer to the output layer
    glGenRenderbuffers(1, &renderBuffer);
    glBindRenderbuffer(GL_RENDERBUFFER, renderBuffer);
    [self.context renderbufferStorage:GL_RENDERBUFFER fromDrawable:layer];
    
    //attach the renderbuffer to the framebuffer
    glGenFramebuffers(1, &frameBuffer);
    glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer);
    glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_RENDERBUFFER, renderBuffer);
}

//create a texture from an image
- (GLuint)createTextureWithImage:(UIImage *)image {
    //convert UIImage to CGImageRef
    CGImageRef cgImageRef = [image CGImage];
    GLuint width = (GLuint)CGImageGetWidth(cgImageRef);
    GLuint height = (GLuint)CGImageGetHeight(cgImageRef);
    CGRect rect = CGRectMake(0, 0, width, height);
    
    //draw the image
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    void *imageData = malloc(width * height * 4);
    CGContextRef context = CGBitmapContextCreate(imageData, width, height, 8, width * 4, colorSpace, kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
    CGContextTranslateCTM(context, 0, height);
    CGContextScaleCTM(context, 1.0f, -1.0f);
    CGColorSpaceRelease(colorSpace);
    CGContextClearRect(context, rect);
    CGContextDrawImage(context, rect, cgImageRef);

    //generate the texture
    GLuint textureID;
    glGenTextures(1, &textureID);
    glBindTexture(GL_TEXTURE_2D, textureID);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, imageData); // 将图片数据写入纹理缓存
    
    //set how texels are mapped to pixels
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    
    //unbind
    glBindTexture(GL_TEXTURE_2D, 0);
    
    //release memory
    CGContextRelease(context);
    free(imageData);
    
    return textureID;
}

//attach a vertex shader and a fragment shader to a shader program and return the program id
- (GLuint)programWithShaderName:(NSString *)shaderName {
    //compile the two shaders
    GLuint vertexShader = [self compileShaderWithName:shaderName type:GL_VERTEX_SHADER];
    GLuint fragmentShader = [self compileShaderWithName:shaderName type:GL_FRAGMENT_SHADER];
    
    //attach the shaders to the program
    GLuint program = glCreateProgram();
    glAttachShader(program, vertexShader);
    glAttachShader(program, fragmentShader);
    
    //link the program
    glLinkProgram(program);
    
    //check whether the link succeeded
    GLint linkSuccess;
    glGetProgramiv(program, GL_LINK_STATUS, &linkSuccess);
    if (linkSuccess == GL_FALSE) {
        GLchar messages[256];
        glGetProgramInfoLog(program, sizeof(messages), 0, &messages[0]);
        NSString *messageString = [NSString stringWithUTF8String:messages];
        NSAssert(NO, @"program链接失败：%@", messageString);
        exit(1);
    }
    return program;
}

//compile a shader and return the shader id
- (GLuint)compileShaderWithName:(NSString *)name type:(GLenum)shaderType {
    //find the shader file
    NSString *shaderPath = [[NSBundle mainBundle] pathForResource:name ofType:shaderType == GL_VERTEX_SHADER ? @"vsh" : @"fsh"]; // 根据不同的类型确定后缀名
    NSError *error;
    NSString *shaderString = [NSString stringWithContentsOfFile:shaderPath encoding:NSUTF8StringEncoding error:&error];
    if (!shaderString) {
        NSAssert(NO, @"读取shader失败");
        exit(1);
    }
    
    //create a shader object
    GLuint shader = glCreateShader(shaderType);
    
    //get the shader content
    const char *shaderStringUTF8 = [shaderString UTF8String];
    int shaderStringLength = (int)[shaderString length];
    glShaderSource(shader, 1, &shaderStringUTF8, &shaderStringLength);
    
    //compile the shader
    glCompileShader(shader);
    
    //check whether the shader compiled successfully
    GLint compileSuccess;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &compileSuccess);
    if (compileSuccess == GL_FALSE) {
        GLchar messages[256];
        glGetShaderInfoLog(shader, sizeof(messages), 0, &messages[0]);
        NSString *messageString = [NSString stringWithUTF8String:messages];
        NSAssert(NO, @"shader编译失败：%@", messageString);
        exit(1);
    }
    
    return shader;
}


#pragma mark -
#pragma mark - public methods



#pragma mark -
#pragma mark - getters and setters
//get the renderbuffer width
- (GLint)drawableWidth {
    GLint backingWidth;
    glGetRenderbufferParameteriv(GL_RENDERBUFFER, GL_RENDERBUFFER_WIDTH, &backingWidth);
    
    return backingWidth;
}

//get the renderbuffer height
- (GLint)drawableHeight {
    GLint backingHeight;
    glGetRenderbufferParameteriv(GL_RENDERBUFFER, GL_RENDERBUFFER_HEIGHT, &backingHeight);
    
    return backingHeight;
}

#pragma mark -
#pragma mark - life cycle
- (void)dealloc {
    if ([EAGLContext currentContext] == self.context) {
        [EAGLContext setCurrentContext:nil];
    }
    //free the array memory in the struct, needs manual free
    if (_vertices) {
        free(_vertices);
        _vertices = nil;
    }
}

@end
```

### Vertex Shader

``` shade
attribute vec4 Position;
attribute vec2 TextureCoords;
varying vec2 TextureCoordsVarying;

void main (void) {
    gl_Position = Position;
    TextureCoordsVarying = TextureCoords;
}

```

### Fragment Shader

``` shade
precision mediump float;

uniform sampler2D Texture;
varying vec2 TextureCoordsVarying;

void main (void) {
    vec4 mask = texture2D(Texture, TextureCoordsVarying);
    gl_FragColor = vec4(mask.rgb, 1.0);
}
```

# Summary

Whenever I have time, I try to study graphics and image related technologies. This post carries a strong personal flavor — if it makes you uncomfortable, please close it quickly. This article is only for personal study notes, but you're welcome to repost or share it within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


[Demo](https://github.com/sunyazhou13/GLSLDemo1)

[Study reference](http://www.lymanli.com/2019/02/17/ios-opengles-render-texture/)
