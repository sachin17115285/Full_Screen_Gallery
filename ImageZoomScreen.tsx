import React from 'react';
import { StyleSheet, Image, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Zoom from './index';

const { width,height } = Dimensions.get('window');

export default function ImageZoomScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Zoom 
      doubleTapConfig={{
        defaultScale: 5,
        minZoomScale: 1,
        maxZoomScale: 4,
      }}

      style={styles.zoomContainer}>
        <Image
          source={{
            uri: 'http://assets.myntassets.com/h_($height),q_($qualityPercentage),w_($width)/v1/assets/images/23915008/2023/7/7/2f9289d6-f59c-4dc2-a42f-af745dfbc07a1688704431452FABBHUEPeach-ColouredPrintedPUFlatformPumpswithBows1.jpg'
          }}
          style={styles.image}
          resizeMode="contain"
        />
      </Zoom>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  zoomContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  image: { width: 1.1 * width, height: height },
}); 