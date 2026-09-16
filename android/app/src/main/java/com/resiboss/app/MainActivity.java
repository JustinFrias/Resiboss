package com.resiboss.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeDownloaderPlugin.class);
        registerPlugin(io.capawesome.capacitorjs.plugins.mlkit.textrecognition.TextRecognitionPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

