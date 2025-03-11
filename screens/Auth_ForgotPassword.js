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
import { API_UEL } from '../config/app'

export default function Auth_ForgotPassword() {
  const Router = useNavigation()
  const { width, height } = Dimensions.get('screen')
  const thema = useColorScheme()

  const forgotPasswordSchema = Yup.object().shape({
    email: Yup.string()
      .email('Por favor, insira um e-mail válido')
      .required('O e-mail é obrigatório')
  })

  const handleSendOtp = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await axios.post(
        `${API_UEL}/send-otp`,
        {
          email: values.email
        }
      )

      if (response.data.success) {
        // Navegar para a tela de verificação OTP
        Router.navigate('Auth_VerifyOtp', { email: values.email })
      } else {
        setErrors({
          apiError: response.data.message || 'Erro ao enviar código de verificação'
        })
      }

      setSubmitting(false)
    } catch (error) {
      console.log(error)
      setSubmitting(false)
      
      const errorMessage = error.response?.data?.message || 'Erro ao processar solicitação. Tente novamente mais tarde.'
      setErrors({
        apiError: errorMessage
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
            
            <Text style={styles.headerText}>Recuperar Senha</Text>
            
            <Formik
              initialValues={{ email: '' }}
              validationSchema={forgotPasswordSchema}
              onSubmit={handleSendOtp}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting
              }) => (
                <>
                  <Text style={styles.instructionText}>
                    Informe seu email para receber um código de verificação.
                  </Text>
                  
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
                      placeholder='Seu email cadastrado'
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
                      <Text style={styles.buttonText}>Enviar Código</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.loginContainer}>
                    <TouchableOpacity
                      onPress={() => Router.navigate('Auth_login')}
                    >
                      <Text style={styles.loginLink}>Voltar para Login</Text>
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
    marginBottom: 20
  },
  instructionText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10
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
    alignItems: 'center',
    paddingTop: 20
  },
  loginLink: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  }
})