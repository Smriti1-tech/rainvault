# Jal-Sanchay Tracker: Android Studio Implementation Guide

If you are moving this project to **Android Studio** using **Kotlin** and **Jetpack Compose**, follow these exact steps:

### 1. Project Creation
1. Open Android Studio -> New Project.
2. Select **Empty Compose Activity**.
3. Name it "JalSanchayTracker".
4. Set Language to **Kotlin**.

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Add a new Android App using your package name (e.g., `com.example.jalsanchay`).
3. Download `google-services.json` and place it in the `app/` folder.
4. Enable **Firestore** and **Google Auth** in the Firebase Console.

### 3. Core Logic (Kotlin)
Copy this logic into your `utils/Calculator.kt`:

```kotlin
fun calculateWater(roofAreaSqFt: Double, rainfallMm: Double): Double {
    val runoffCoefficient = 0.9
    val areaSqMeters = roofAreaSqFt * 0.092903
    return areaSqMeters * rainfallMm * runoffCoefficient
}
```

### 4. Database Schema (Firestore)
- **Collection**: `users`
  - **Document**: `{userId}`
    - `roofArea`: Number
    - `tankCapacity`: Number
    - **Subcollection**: `entries`
      - `amountMm`: Number
      - `waterCollected`: Number
      - `timestamp`: Timestamp

### 5. Quick Option: Wrap as WebView (Run Web App on Android)
If you just want to run this React app inside an Android container:
1. In your `MainActivity.kt`:
```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AndroidView(factory = {
                WebView(it).apply {
                    webViewClient = WebViewClient()
                    settings.javaScriptEnabled = true
                    loadUrl("https://your-deployed-app-url.run.app")
                }
            })
        }
    }
}
```
2. Add Internet Permission to `AndroidManifest.xml`:
`<uses-permission android:name="android.permission.INTERNET" />`

### 6. Compose UI Tips (Native Implementation)
