# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native WebView
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# WebView
-keep class * extends android.webkit.WebViewClient
-keep class * extends android.webkit.WebChromeClient
-keep class * extends android.webkit.JavascriptInterface
-keep class android.webkit.WebView { *; }
-keep class android.webkit.WebViewClient { *; }
-keep class android.webkit.WebChromeClient { *; }

# React Native WebView specific
-keep class com.reactnativecommunity.webview.** { *; }
-keep class org.chromium.** { *; }

# Network Security
-keep class javax.net.ssl.** { *; }
-keep class org.apache.http.** { *; }

# JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Prevent obfuscation of React Native bridge
-keep class com.facebook.react.bridge.** { *; }

# Keep JSON parsing classes
-keep class com.google.gson.** { *; }
-keep class org.json.** { *; }

# Keep WebView related classes for Stripe payments
-keep class * implements android.webkit.WebViewClient
-keep class * implements android.webkit.WebChromeClient

# React Native WebView Package
-keep class com.reactnativecommunity.webview.** { *; }
-keep class com.reactnativecommunity.webview.RNCWebViewManager { *; }
-keep class com.reactnativecommunity.webview.RNCWebView { *; }

# Keep all classes needed for JavaScript bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep React Native modules
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Keep networking classes
-keep class com.facebook.react.modules.network.** { *; }
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Keep WebView cookies and storage
-keep class android.webkit.CookieManager { *; }
-keep class android.webkit.WebStorage { *; }

# Prevent crashes in release builds
-dontwarn com.reactnativecommunity.webview.**
-dontwarn org.chromium.**
