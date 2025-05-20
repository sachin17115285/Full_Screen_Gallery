import React, { useState } from 'react';
import { StyleSheet, Image, SafeAreaView, Dimensions, View, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Zoom from './index';

const { width,height } = Dimensions.get('window');

const images = [
  "https://assets.myntassets.com/v1/assets/images/15557590/2022/2/18/a88d594a-0184-4042-baad-01c2d7874cec1645166286136-Roadster-Men-Shirts-4091645166285596-1.jpg",
  "https://assets.myntassets.com/v1/assets/images/29270038/2024/4/30/5254f373-744e-4780-be2f-368fabb4b9d81714486426940V-MartMenSolidCottonKnittedDenimMid-RiseJeansM1.jpg",
  "https://assets.myntassets.com/v1/assets/images/25556926/2023/10/19/ba4e6452-f1a6-4ca2-8aa0-e12917f7be9d1697721434740WATCHSTARMenBlackDialSilverTonedStainlessSteelBraceletStyleS1.jpg",
  "https://assets.myntassets.com/v1/assets/images/25459436/2023/10/27/011d5fe9-99f5-4831-819b-f3c4b3ce96911698384279197-Woodland-Men-Casual-Shoes-4421698384279006-1.jpg",
  "https://assets.myntassets.com/v1/assets/images/25827482/2024/1/10/8abbe80d-ceb9-44a2-869d-ff73e33f92791704887276042-WROGN-Men-Jeans-4811704887275592-1.jpg",
];

export default function ImageZoomScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.chevronContainer}>
        {currentIndex > 0 && (
          <TouchableOpacity style={styles.chevronLeft} onPress={goPrev}>
            <Text style={styles.chevronText}>{'<'}</Text>
          </TouchableOpacity>
        )}
        <Zoom style={styles.zoomContainer}
        >
          <Image
            source={{ uri: images[currentIndex] }}
            style={styles.image}
            resizeMode="contain"
          />
        </Zoom>
        {currentIndex < images.length - 1 && (
          <TouchableOpacity style={styles.chevronRight} onPress={goNext}>
            <Text style={styles.chevronText}>{'>'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  chevronContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: width,
    height: height,
  },
  chevronLeft: {
    position: 'absolute',
    left: 5,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 4,
    top: '50%',
    transform: [{ translateY: -20 }],
  },
  chevronRight: {
    position: 'absolute',
    right: 5,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 4,
    top: '50%',
    transform: [{ translateY: -20 }],
  },
  chevronText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 