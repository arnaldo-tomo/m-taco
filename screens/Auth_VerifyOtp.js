import { useNavigation, useRoute } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import React, { useState, useEffect, useRef } from 'react'
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
import axios from 'axios'
import { API_UEL } from '../config/app'

export default function Auth_VerifyOtp() {
  const Router = useNavigation()
  const route = useRoute()
  const { width, height } = Dimensions.get('screen')
  
  const { email } = route.params || {}
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(600) // 10 minutos em segundos
  const [isResendDisabled, setIsResendDisabled] = useState(true)
  const [resendCooldown, setResendCooldown] = useState(60) // 60 segundos para poder reenviar
  
  const inputRefs = useRef([])
  
  // Inicializar refs para os inputs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6)
  }, [])
  
  // Timer para contagem regressiva do OTP
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])
  
  // Timer para habilitar o botão de reenvio
  useEffect(() => {
    if (resendCooldown <= 0) {
      setIsResendDisabled(false)
      return
    }
    
    const cooldownTimer = setInterval(() => {
      setResendCooldown(prev => prev - 1)
    }, 1000)

    return () => clearInterval(cooldownTimer)
  }, [resendCooldown])
  
  // Formatar o tempo restante
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`
  }
  
  // Lidar com a entrada do OTP
  const handleOtpChange = (text, index) => {
    const newOtp = [...otp]
    
    // Permitir apenas dígitos
    const formattedText = text.replace(/[^0-9]/g, '')
    newOtp[index] = formattedText
    
    setOtp(newOtp)
    
    // Mover para o próximo input se o atual foi preenchido
    if (formattedText.length === 1 && index < 5) {
      inputRefs.current[index + 1].focus()
    }
  }
  
  // Lidar com a tecla de apagar
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1].focus()
    }
  }
  
  // Reenviar OTP
  const handleResendOtp = async () => {
    try {
      setIsResendDisabled(true)
      setResendCooldown(60)
      setTimeRemaining(600) // Reiniciar o tempo do OTP

      const response = await axios.post(
        `${API_UEL}/send-otp`,
        { email }
      )

      if (!response.data.success) {
        Alert.alert('Erro', response.data.message || 'Não foi possível reenviar o código.')
      } else {
        Alert.alert('Sucesso', 'Um novo código foi enviado para o seu email.')
      }
    } catch (error) {
      console.log(error)
      Alert.alert('Erro', 'Não foi possível reenviar o código. Tente novamente mais tarde.')
    }
  }
  
  // Verificar OTP
  const handleVerifyOtp = async () => {
    // Verificar se todos os dígitos foram preenchidos
    if (otp.some(digit => digit === '')) {
      setError('Por favor, complete todos os dígitos do código')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await axios.post(
        `${API_UEL}/verify-otp`,
        {
          email,
          otp: otp.join('')
        }
      )

      if (response.data.success) {
        // Navegar para a tela de redefinição de senha
        Router.navigate('Auth_ResetPassword', { 
          email: response.data.email, 
          token: response.data.token 
        })
      } else {
        setError(response.data.message || 'Código inválido. Tente novamente.')
      }
    } catch (error) {
      console.log(error)
      const errorMessage = error.response?.data?.message || 'Erro ao verificar código. Tente novamente mais tarde.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
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
                marginBottom: 40,
                tintColor: '#FFFFFF'
              }}
            />
            
            <Text style={styles.headerText}>Verificação</Text>
            
            <Text style={styles.instructionText}>
              Digite o código de 6 dígitos enviado para{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
            
            {/* Contador regressivo */}
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={24} color="#FFFFFF" />
              <Text style={styles.timerText}>
                {timeRemaining > 0 
                  ? `Código válido por: ${formatTime(timeRemaining)}` 
                  : "Código expirado. Por favor, solicite um novo código."}
              </Text>
            </View>
            
            {/* Entrada OTP */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => inputRefs.current[index] = ref}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={text => handleOtpChange(text, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  maxLength={1}
                  keyboardType="number-pad"
                  selectionColor="#FFFFFF"
                />
              ))}
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TouchableOpacity
              onPress={handleVerifyOtp}
              style={[styles.button, { opacity: isSubmitting ? 0.7 : 1 }]}
              disabled={isSubmitting || timeRemaining === 0}
            >
              {isSubmitting ? (
                <ActivityIndicator size='small' color='#FFFFFF' />
              ) : (
                <Text style={styles.buttonText}>Verificar</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Não recebeu o código? </Text>
              {isResendDisabled ? (
                <Text style={styles.cooldownText}>
                  Reenviar em {resendCooldown}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.resendLink}>Reenviar</Text>
                </TouchableOpacity>
              )}
            </View>
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
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 10
  },
  emailText: {
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30
  },
  timerText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 20
  },
  otpInput: {
    width: 45,
    height: 55,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 29, 37, 0.5)',
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#FFFFFF',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  resendText: {
    color: '#FFFFFF'
  },
  resendLink: {
    color: '#007BFF',
    fontWeight: 'bold'
  },
  cooldownText: {
    color: '#AAAAAA',
    fontWeight: 'bold'
  }
})