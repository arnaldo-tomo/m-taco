import { useNavigation } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Image } from 'expo-image'
import {
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  View,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator
} from 'react-native'
import { Formik } from 'formik'
import * as Yup from 'yup'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_UEL } from '../config/app'

export default function Auth_login () {
  const Router = useNavigation()
  const { width, height } = Dimensions.get('screen')
  const thema = useColorScheme()

  const loginValidationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Por favor, insira um e-mail válido')
      .required('O e-mail é obrigatório'),
    password: Yup.string()
      .min(6, 'A senha deve ter pelo menos 6 caracteres')
      .required('A senha é obrigatória')
  })

  const handleLogin = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await axios.post(
       `${API_UEL}/login`,
        {
          email: values.email,
          password: values.password
        }
      )

      const { id, name } = response.data.user
      await AsyncStorage.setItem('userId', id.toString())
      await AsyncStorage.setItem('userName', name)
      setSubmitting(false)
      Router.navigate('Home')
    } catch (error) {
      console.log(error)
      setSubmitting(false)
      setErrors({
        apiError: 'Erro ao fazer login. Verifique suas credenciais.'
      })
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style='light' animated={true} translucent={true} />
      <ImageBackground
        source={require('../assets/bg.png')}
        style={{
          flex: 1,
          width: width,
          height: height,
          alignSelf: 'center',
          alignContent: 'center'
        }}
        resizeMode='cover'
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={{
                width: 100,
                height: 100,
                alignSelf: 'center',
                marginBottom: 50,
                tintColor: '#FFFFFF'
              }}
            />
            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={loginValidationSchema}
              onSubmit={handleLogin}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting,
                setFieldValue
              }) => (
                <>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor:
                          errors.email && touched.email ? 'red' : '#ccc'
                      }
                    ]}
                  >
                    <Image
                      source={require('../assets/Icons/mail.svg')}
                      style={{
                        width: 30,
                        height: 30,
                        tintColor: '#FFFFFF'
                      }}
                    />
                    <TextInput
                      placeholderTextColor={'#FFFFFF'}
                      style={[styles.input, { color: '#FFFFFF' }]}
                      placeholder='Seu email'
                      keyboardType='email-address'
                      autoCapitalize='none'
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                    />
                  </View>
                  {errors.email && touched.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}

                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor:
                          errors.password && touched.password ? 'red' : '#ccc'
                      }
                    ]}
                  >
                    <Image
                      source={require('../assets/Icons/lock.svg')}
                      style={{
                        width: 30,
                        height: 30,
                        tintColor: '#FFFFFF'
                      }}
                    />
                    <TextInput
                      placeholderTextColor={'#FFFFFF'}
                      style={[styles.input, { color: '#FFFFFF' }]}
                      placeholder='Sua Senha'
                      secureTextEntry={!values.showPassword}
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                    />
                    <TouchableOpacity
                      style={{ position: 'absolute', right: 10 }}
                      onPress={() =>
                        setFieldValue('showPassword', !values.showPassword)
                      }
                    >
                      <Ionicons
                        name={values.showPassword ? 'eye' : 'eye-off'}
                        size={24}
                        color={'#FFFFFF'}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && touched.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}

                  {errors.apiError && (
                    <Text style={styles.errorText}>{errors.apiError}</Text>
                  )}

                  <TouchableOpacity onPress={()=>Router.navigate('Auth_ForgotPassword')} style={{ paddingBottom: 15 }}>
                    <Text style={styles.forgotPasswordText}>
                      Esqueceu sua senha?
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSubmit}
                    style={[styles.button, { opacity: isSubmitting ? 0.7 : 1 }]}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size='small' color='#FFFFFF' />
                    ) : (
                      <Text style={styles.buttonText}>Entrar</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.signUpContainer}>
                    <Text style={styles.signUpText}>Não tem uma conta?</Text>
                    <TouchableOpacity
                      onPress={() => Router.navigate('Auth_Register')}
                    >
                      <Text style={styles.signUpLink}>Cadastre-se</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Formik>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  inputContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(30, 29, 37, 0.5)',
    height: 55,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    paddingLeft: 8,
    flex: 1
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    marginTop: -15,
    marginLeft: 10
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 5
  },
  forgotPasswordText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    alignSelf: 'flex-end'
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingTop: 15
  },
  signUpText: {
    color: '#FFFFFF'
  },
  signUpLink: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5
  }
})
