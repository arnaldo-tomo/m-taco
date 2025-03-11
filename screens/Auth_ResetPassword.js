import { useNavigation, useRoute } from '@react-navigation/native'
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
  ActivityIndicator,
  Alert
} from 'react-native'
import { Formik } from 'formik'
import * as Yup from 'yup'
import axios from 'axios'
import { API_UEL } from '../config/app'

export default function Auth_ResetPassword() {
  const Router = useNavigation()
  const route = useRoute()
  const { width, height } = Dimensions.get('screen')
  const [resetSuccess, setResetSuccess] = useState(false)
  
  // Obter token e email dos parâmetros da rota
  const { token, email } = route.params || {}

  const resetPasswordSchema = Yup.object().shape({
    password: Yup.string()
      .min(6, 'A senha deve ter pelo menos 6 caracteres')
      .required('A senha é obrigatória'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'As senhas não coincidem')
      .required('Confirmação de senha é obrigatória')
  })

  const handleResetPassword = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await axios.post(
        `${API_UEL}/reset-password-with-token`,
        {
          email: email,
          token: token,
          password: values.password,
          password_confirmation: values.confirmPassword
        }
      )

      if (response.data.success) {
        setResetSuccess(true)
      } else {
        setErrors({
          apiError: response.data.message || 'Erro ao redefinir senha'
        })
      }
    } catch (error) {
      console.log(error)
      const errorMessage = error.response?.data?.message || 'Erro ao processar solicitação. Tente novamente mais tarde.'
      setErrors({
        apiError: errorMessage
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Se não tiver token ou email, mostrar mensagem de erro
  if (!token || !email) {
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
          <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
            <Ionicons name="alert-circle" size={64} color="red" />
            <Text style={[styles.headerText, {marginTop: 20}]}>Link Inválido</Text>
            <Text style={styles.instructionText}>Não foi possível redefinir sua senha. Por favor, tente novamente.</Text>
            
            <TouchableOpacity
              onPress={() => Router.navigate('Auth_ForgotPassword')}
              style={[styles.button, {marginTop: 30}]}
            >
              <Text style={styles.buttonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    )
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
              onPress={() => Router.navigate('Auth_login')}
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
            
            <Text style={styles.headerText}>Nova Senha</Text>
            
            {resetSuccess ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={64} color="#4BB543" />
                <Text style={styles.successText}>
                  Senha redefinida com sucesso!
                </Text>
                <TouchableOpacity
                  onPress={() => Router.navigate('Auth_login')}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Ir para Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Formik
                initialValues={{ password: '', confirmPassword: '', showPassword: false, showConfirmPassword: false }}
                validationSchema={resetPasswordSchema}
                onSubmit={handleResetPassword}
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
                    <Text style={styles.instructionText}>
                      Defina uma nova senha para sua conta
                    </Text>
                    
                    {/* Email (somente exibição) */}
                    <View
                      style={[
                        styles.inputContainer,
                        { backgroundColor: 'rgba(50, 50, 60, 0.5)' }
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
                        style={[styles.input, { color: '#FFFFFF' }]}
                        value={email}
                        editable={false}
                      />
                    </View>
                    
                    {/* Nova Senha */}
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
                        placeholder='Nova senha'
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
                        placeholder='Confirme a nova senha'
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
                        <Text style={styles.buttonText}>Salvar Nova Senha</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </Formik>
            )}
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
  successContainer: {
    alignItems: 'center',
    padding: 20
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20
  }
})