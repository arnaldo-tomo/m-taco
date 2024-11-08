import React, { useEffect, useState } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from '../screens/HomeScreen'
import { NavigationContainer } from '@react-navigation/native'
import ExtratoScreen from '../screens/ExtratoScreen'
import Auth_login from '../screens/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ActivityIndicator, View } from 'react-native'
import Profile from "../screens/Profile";

const Stack = createNativeStackNavigator();

export default function Route() {
  const [initialRouteName, setInitialRouteName] = useState(null);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          setInitialRouteName("Home");
        } else {
          setInitialRouteName("Auth_login");
        }
      } catch (error) {
        console.error("Erro ao verificar o login:", error);
        setInitialRouteName("Auth_login");
      }
    };

    checkUserLoggedIn();
  }, []);

  if (!initialRouteName) {
    // Enquanto verifica o estado de login, exiba um indicador de carregamento
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen
          options={{ headerShown: false }}
          name="Auth_login"
          component={Auth_login}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Home"
          component={HomeScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="ExtratoScreen"
          component={ExtratoScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="ProfileScreen"
          component={Profile}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
