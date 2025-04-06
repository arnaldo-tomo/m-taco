import {
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet
} from 'react-native'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { StatusBar } from 'expo-status-bar'
import { TextInput } from 'react-native'
import { Formik } from 'formik'
import axios from 'axios'
import React, { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Yup from 'yup'
import { showMessage } from 'react-native-flash-message'
import { API_UEL } from '../config/app'

export default function Profile({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('O nome é obrigatório')
      .min(3, 'O nome deve ter pelo menos 3 caracteres'),
    email: Yup.string()
      .email('E-mail inválido')
      .required('O e-mail é obrigatório'),
    currentPassword: Yup.string(),
    newPassword: Yup.string()
      .min(6, 'A senha deve ter pelo menos 6 caracteres')
      .when('currentPassword', {
        is: val => val && val.length > 0,
        then: schema => schema.required('Nova senha é obrigatória quando a senha atual é fornecida')
      }),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], 'As senhas não coincidem')
      .when('newPassword', {
        is: val => val && val.length > 0,
        then: schema => schema.required('Confirmação de senha é obrigatória')
      })
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId')
        if (!userId) {
          navigation.replace('Auth_login')
          return
        }

        const response = await axios.get(`${API_UEL}/user/${userId}`)
        setUserData(response.data)
        setLoading(false)
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
        showMessage({
          message: 'Erro ao carregar perfil',
          type: 'danger',
          duration: 3000,
          floating: true
        })
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleUpdateProfile = async (values) => {
    setIsSaving(true);
    
    try {
      const userId = await AsyncStorage.getItem('userId');
      
      const requestData = {
        name: values.name,
        email: values.email
      };
      
      // Adicionar senha apenas se o usuário forneceu a senha atual
      if (values.currentPassword) {
        requestData.current_password = values.currentPassword;
        requestData.new_password = values.newPassword;
      }
      
      // Fazer a requisição para atualizar o perfil
      await axios.put(`${API_UEL}/user/${userId}`, requestData);
      
      // Atualizar o nome do usuário no AsyncStorage
      // O método setItem retorna uma Promise que resolve para undefined
      // Por isso o console.log estava mostrando undefined
      await AsyncStorage.setItem('userName', values.name);
      
      // Verificar se o nome foi salvo corretamente
      const savedName = await AsyncStorage.getItem('userName');
      console.log('Updated user name:', savedName);
      
      showMessage({
        message: 'Perfil atualizado com sucesso!',
        type: 'success',
        duration: 3000,
        floating: true
      });
      
      // Navegar de volta para a tela inicial
      navigation.goBack();
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      
      let errorMessage = 'Erro ao atualizar perfil';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      showMessage({
        message: errorMessage,
        type: 'danger',
        duration: 3000,
        floating: true
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor:"white" }}>
        <Image source={require('../assets/spinner.gif')} style={{ width: 100, height: 100 }} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style='light' animated={true} translucent={true} />
      <ImageBackground
        source={require('../assets/bg.png')}
        style={{ flex: 1, paddingTop: 35 }}
      >
        {/* Header */}
        <View
          style={{
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <TouchableOpacity
            style={{ paddingHorizontal: 10 }}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('../assets/Icons/back.svg')}
              style={{ height: 24, width: 24, tintColor: 'white' }}
            />
          </TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
            Meu Perfil
          </Text>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}>
          {/* Foto de perfil */}
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10
              }}
            >
              <Image
                source={require('../assets/Icons/user.svg')}
                style={{ height: 60, width: 60, tintColor: 'white' }}
              />
            </View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {userData.name}
            </Text>
          </View>

          {/* Formulário de atualização de perfil */}
          <Formik
            initialValues={{
              name: userData.name || '',
              email: userData.email || '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            }}
            validationSchema={validationSchema}
            onSubmit={handleUpdateProfile}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched
            }) => (
              <BlurView
                intensity={60}
                tint='dark'
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  padding: 16,
                  marginBottom: 20
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: 20
                }}>
                  Informações Pessoais
                </Text>

                {/* Nome */}
                <Text style={{ color: 'white', marginBottom: 5 }}>Nome</Text>
                <View
                  style={{
                    backgroundColor: 'rgba(30, 29, 37, 0.5)',
                    height: 55,
                    borderColor: errors.name && touched.name ? 'red' : '#ccc',
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 15
                  }}
                >
                  <Image
                    source={require('../assets/Icons/user.svg')}
                    style={{
                      width: 20,
                      height: 20,
                      tintColor: '#FFFFFF'
                    }}
                  />
                  <TextInput
                    placeholderTextColor={'#FFFFFF'}
                    style={{
                      paddingLeft: 8,
                      flex: 1,
                      color: '#FFFFFF'
                    }}
                    placeholder='Seu nome'
                    value={values.name}
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                  />
                </View>
                {errors.name && touched.name && (
                  <Text style={{ color: 'red', marginTop: -10, marginBottom: 10 }}>
                    {errors.name}
                  </Text>
                )}

                {/* Email */}
                <Text style={{ color: 'white', marginBottom: 5 }}>E-mail</Text>
                <View
                  style={{
                    backgroundColor: 'rgba(30, 29, 37, 0.5)',
                    height: 55,
                    borderColor: errors.email && touched.email ? 'red' : '#ccc',
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 15
                  }}
                >
                  <Image
                    source={require('../assets/Icons/mail.svg')}
                    style={{
                      width: 20,
                      height: 20,
                      tintColor: '#FFFFFF'
                    }}
                  />
                  <TextInput
                    placeholderTextColor={'#FFFFFF'}
                    style={{
                      paddingLeft: 8,
                      flex: 1,
                      color: '#FFFFFF'
                    }}
                    placeholder='Seu email'
                    keyboardType='email-address'
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                  />
                </View>
                {errors.email && touched.email && (
                  <Text style={{ color: 'red', marginTop: -10, marginBottom: 10 }}>
                    {errors.email}
                  </Text>
                )}

                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginTop: 10,
                  marginBottom: 20
                }}>
                  Alterar Senha (opcional)
                </Text>

                {/* Senha Atual */}
                <Text style={{ color: 'white', marginBottom: 5 }}>Senha Atual</Text>
                <View
                  style={{
                    backgroundColor: 'rgba(30, 29, 37, 0.5)',
                    height: 55,
                    borderColor: errors.currentPassword && touched.currentPassword ? 'red' : '#ccc',
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 15
                  }}
                >
                  <Image
                    source={require('../assets/Icons/lock.svg')}
                    style={{
                      width: 20,
                      height: 20,
                      tintColor: '#FFFFFF'
                    }}
                  />
                  <TextInput
                    placeholderTextColor={'#FFFFFF'}
                    style={{
                      paddingLeft: 8,
                      flex: 1,
                      color: '#FFFFFF'
                    }}
                    placeholder='Senha atual'
                    secureTextEntry={true}
                    value={values.currentPassword}
                    onChangeText={handleChange('currentPassword')}
                    onBlur={handleBlur('currentPassword')}
                  />
                </View>
                {errors.currentPassword && touched.currentPassword && (
                  <Text style={{ color: 'red', marginTop: -10, marginBottom: 10 }}>
                    {errors.currentPassword}
                  </Text>
                )}

                {/* Nova Senha */}
                <Text style={{ color: 'white', marginBottom: 5 }}>Nova Senha</Text>
                <View
                  style={{
                    backgroundColor: 'rgba(30, 29, 37, 0.5)',
                    height: 55,
                    borderColor: errors.newPassword && touched.newPassword ? 'red' : '#ccc',
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 15
                  }}
                >
                  <Image
                    source={require('../assets/Icons/lock.svg')}
                    style={{
                      width: 20,
                      height: 20,
                      tintColor: '#FFFFFF'
                    }}
                  />
                  <TextInput
                    placeholderTextColor={'#FFFFFF'}
                    style={{
                      paddingLeft: 8,
                      flex: 1,
                      color: '#FFFFFF'
                    }}
                    placeholder='Nova senha'
                    secureTextEntry={true}
                    value={values.newPassword}
                    onChangeText={handleChange('newPassword')}
                    onBlur={handleBlur('newPassword')}
                  />
                </View>
                {errors.newPassword && touched.newPassword && (
                  <Text style={{ color: 'red', marginTop: -10, marginBottom: 10 }}>
                    {errors.newPassword}
                  </Text>
                )}

                {/* Confirmar Senha */}
                <Text style={{ color: 'white', marginBottom: 5 }}>Confirmar Nova Senha</Text>
                <View
                  style={{
                    backgroundColor: 'rgba(30, 29, 37, 0.5)',
                    height: 55,
                    borderColor: errors.confirmPassword && touched.confirmPassword ? 'red' : '#ccc',
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 15
                  }}
                >
                  <Image
                    source={require('../assets/Icons/lock.svg')}
                    style={{
                      width: 20,
                      height: 20,
                      tintColor: '#FFFFFF'
                    }}
                  />
                  <TextInput
                    placeholderTextColor={'#FFFFFF'}
                    style={{
                      paddingLeft: 8,
                      flex: 1,
                      color: '#FFFFFF'
                    }}
                    placeholder='Confirme a nova senha'
                    secureTextEntry={true}
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                  />
                </View>
                {errors.confirmPassword && touched.confirmPassword && (
                  <Text style={{ color: 'red', marginTop: -10, marginBottom: 10 }}>
                    {errors.confirmPassword}
                  </Text>
                )}

                {/* Botão de salvar */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#007BFF',
                    paddingVertical: 12,
                    borderRadius: 16,
                    alignItems: 'center',
                    marginTop: 20
                  }}
                  onPress={handleSubmit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size='small' color='#FFFFFF' />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                      Salvar Alterações
                    </Text>
                  )}
                </TouchableOpacity>
              </BlurView>
            )}
          </Formik>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}