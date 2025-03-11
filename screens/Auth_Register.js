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

export default function Auth_Register() {
  const Router = useNavigation()
  const { width, height } = Dimensions.get('screen')
  const thema = useColorScheme()

  const registerValidationSchema = Yup.object().shape({
    name: Yup.string()
      .required('O nome é obrigatório')
      .min(3, 'O nome deve ter pelo menos 3 caracteres'),
    email: Yup.string()
      .email('Por favor, insira um e-mail válido')
      .required('O e-mail é obrigatório'),
    password: Yup.string()
      .min(6, 'A senha deve ter pelo menos 6 caracteres')
      .required('A senha é obrigatória'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'As senhas não coincidem')
      .required('Confirmação de senha é obrigatória')
  })

  const handleRegister = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await axios.post(
        `${API_UEL}/register`,
        {
          name: values.name,
          email: values.email,
          password: values.password
        }
      )
    //   console.log(response.data);
      const { id, name } = response.data.user
      await AsyncStorage.setItem('userId', id.toString())
      await AsyncStorage.setItem('userName', name)
      setSubmitting(false)
      Router.navigate('Home')
    } catch (error) {
      console.log(error)
      setSubmitting(false)
      setErrors({
        apiError: 'Erro ao fazer cadastro. Tente novamente mais tarde.'
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => Router.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
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
            <Text style={styles.headerText}>Criar Conta</Text>
            
            <Formik
              initialValues={{ name: '', email: '', password: '', confirmPassword: '', showPassword: false, showConfirmPassword: false }}
              validationSchema={registerValidationSchema}
              onSubmit={handleRegister}
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
                  {/* Nome */}
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor:
                          errors.name && touched.name ? 'red' : '#ccc'
                      }
                    ]}
                  >
                    <Image
                      source={require('../assets/Icons/user.svg')}
                      style={{
                        width: 30,
                        height: 30,
                        tintColor: '#FFFFFF'
                      }}
                    />
                    <TextInput
                      placeholderTextColor={'#FFFFFF'}
                      style={[styles.input, { color: '#FFFFFF' }]}
                      placeholder='Seu nome completo'
                      autoCapitalize='words'
                      value={values.name}
                      onChangeText={handleChange('name')}
                      onBlur={handleBlur('name')}
                    />
                  </View>
                  {errors.name && touched.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}

                  {/* Email */}
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

                  {/* Senha */}
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
                      placeholder='Crie uma senha'
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

                  {/* Confirmar Senha */}
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor:
                          errors.confirmPassword && touched.confirmPassword ? 'red' : '#ccc'
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
                      placeholder='Confirme sua senha'
                      secureTextEntry={!values.showConfirmPassword}
                      value={values.confirmPassword}
                      onChangeText={handleChange('confirmPassword')}
                      onBlur={handleBlur('confirmPassword')}
                    />
                    <TouchableOpacity
                      style={{ position: 'absolute', right: 10 }}
                      onPress={() =>
                        setFieldValue('showConfirmPassword', !values.showConfirmPassword)
                      }
                    >
                      <Ionicons
                        name={values.showConfirmPassword ? 'eye' : 'eye-off'}
                        size={24}
                        color={'#FFFFFF'}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}

                  {errors.apiError && (
                    <Text style={styles.errorText}>{errors.apiError}</Text>
                  )}

                  <TouchableOpacity
                    onPress={handleSubmit}
                    style={[styles.button, { opacity: isSubmitting ? 0.7 : 1 }]}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size='small' color='#FFFFFF' />
                    ) : (
                      <Text style={styles.buttonText}>Cadastrar</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Já tem uma conta?</Text>
                    <TouchableOpacity
                      onPress={() => Router.navigate('Auth_login')}
                    >
                      <Text style={styles.loginLink}>Faça login</Text>
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30
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
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingTop: 15
  },
  loginText: {
    color: '#FFFFFF'
  },
  loginLink: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5
  }
})