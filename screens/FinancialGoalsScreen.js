import {
    Text,
    View,
    ImageBackground,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    TextInput,
    Modal,
    StyleSheet,
    Platform
  } from 'react-native'
  import { BlurView } from 'expo-blur'
  import { Image } from 'expo-image'
  import { StatusBar } from 'expo-status-bar'
  import React, { useState, useEffect, useRef } from 'react'
  import AsyncStorage from '@react-native-async-storage/async-storage'
  import { showMessage } from 'react-native-flash-message'
  import { API_UEL } from '../config/app'
  import axios from 'axios'
  import { format } from 'date-fns'
  import { ptBR } from 'date-fns/locale'
  import { Formik } from 'formik'
  import * as Yup from 'yup'
  
  export default function FinancialGoalsScreen({ navigation }) {
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState(null)
    const [userName, setUserName] = useState(null)
    const [currentMonth, setCurrentMonth] = useState('')
    const [goals, setGoals] = useState([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [dateInputs, setDateInputs] = useState({ day: '', month: '', year: '' })
    
    // Refs para os campos de data
    const monthInputRef = useRef(null)
    const yearInputRef = useRef(null)
    
    const goalValidationSchema = Yup.object().shape({
      title: Yup.string()
        .required('O título da meta é obrigatório')
        .min(3, 'O título deve ter pelo menos 3 caracteres'),
      target_amount: Yup.number()
        .required('O valor alvo é obrigatório')
        .positive('O valor deve ser positivo')
        .typeError('Digite um valor válido'),
      initial_amount: Yup.number()
        .min(0, 'O valor inicial não pode ser negativo')
        .typeError('Digite um valor válido')
        .nullable(),
      description: Yup.string()
        .nullable()
    })
    
    useEffect(() => {
      const month = format(new Date(), 'MMMM', { locale: ptBR })
      setCurrentMonth(month.charAt(0).toUpperCase() + month.slice(1))
  
      const fetchUserData = async () => {
        try {
          const storedUserId = await AsyncStorage.getItem('userId')
          const storedUserName = await AsyncStorage.getItem('userName')
  
          if (storedUserId !== null && storedUserName !== null) {
            setUserId(storedUserId)
            setUserName(storedUserName)
            
            fetchGoals(storedUserId)
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error)
        }
      }
  
      fetchUserData()
    }, [])
    
    const fetchGoals = async (userId) => {
      try {
        const response = await axios.get(`${API_UEL}/financial-goals`, {
          params: { user_id: userId }
        })
        
        setGoals(response.data)
        setLoading(false)
      } catch (error) {
        console.error('Erro ao buscar metas financeiras:', error)
        setLoading(false)
      }
    }
    
    const handleAddGoal = async (values, { resetForm }) => {
      // Validar data inserida
      const { day, month, year } = dateInputs
      
      if (!day || !month || !year || day === '' || month === '' || year === '') {
        showMessage({
          message: 'Por favor, preencha a data alvo completa',
          type: 'warning',
          duration: 3000,
          floating: true
        })
        return
      }
      
      // Criar objeto de data e validar
      const targetDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      )
      
      if (isNaN(targetDate.getTime())) {
        showMessage({
          message: 'Por favor, insira uma data válida',
          type: 'warning',
          duration: 3000,
          floating: true
        })
        return
      }
      
      // Verificar se a data é no futuro
      const today = new Date()
      if (targetDate <= today) {
        showMessage({
          message: 'A data alvo deve ser no futuro',
          type: 'warning',
          duration: 3000,
          floating: true
        })
        return
      }
      
      setSubmitting(true)
      
      try {
        const formattedValues = {
          ...values,
          user_id: userId,
          target_date: format(targetDate, 'yyyy-MM-dd'),
          initial_amount: values.initial_amount || 0
        }
        
        const response = await axios.post(`${API_UEL}/financial-goals`, formattedValues)
        
        // Atualizar lista de metas
        await fetchGoals(userId)
        
        showMessage({
          message: 'Meta financeira adicionada com sucesso!',
          type: 'success',
          duration: 3000,
          floating: true
        })
        
        // Fechar modal e resetar form
        setShowAddModal(false)
        resetForm()
        setDateInputs({ day: '', month: '', year: '' })
      } catch (error) {
        console.error('Erro ao adicionar meta financeira:', error)
        
        showMessage({
          message: 'Erro ao adicionar meta financeira',
          type: 'danger',
          duration: 3000,
          floating: true
        })
      } finally {
        setSubmitting(false)
      }
    }
    
    const handleDeleteGoal = async (goalId) => {
      try {
        await axios.delete(`${API_UEL}/financial-goals/${goalId}`)
        
        // Atualizar lista de metas
        await fetchGoals(userId)
        
        showMessage({
          message: 'Meta financeira removida com sucesso!',
          type: 'success',
          duration: 3000,
          floating: true
        })
      } catch (error) {
        console.error('Erro ao remover meta financeira:', error)
        
        showMessage({
          message: 'Erro ao remover meta financeira',
          type: 'danger',
          duration: 3000,
          floating: true
        })
      }
    }
    
    const handleAddContribution = async (goalId, amount) => {
      try {
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
          showMessage({
            message: 'Por favor, insira um valor válido',
            type: 'warning',
            duration: 3000,
            floating: true
          })
          return
        }
        
        await axios.post(`${API_UEL}/financial-goals/${goalId}/contributions`, {
          user_id: userId,
          amount: parseFloat(amount)
        })
        
        // Atualizar lista de metas
        await fetchGoals(userId)
        
        showMessage({
          message: 'Contribuição adicionada com sucesso!',
          type: 'success',
          duration: 3000,
          floating: true
        })
      } catch (error) {
        console.error('Erro ao adicionar contribuição:', error)
        
        showMessage({
          message: 'Erro ao adicionar contribuição',
          type: 'danger',
          duration: 3000,
          floating: true
        })
      }
    }
    
    const formatCurrency = value => {
      return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN'
      }).format(value)
    }
    
    // Calcular porcentagem de progresso da meta
    const getGoalProgressPercent = (goal) => {
      if (!goal.target_amount) return 0
      return Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
    }
    
    // Determinar cor baseada no progresso da meta
    const getGoalProgressColor = (goal) => {
      const percentage = getGoalProgressPercent(goal)
      
      if (percentage >= 90) return '#2ecc71' // Verde
      if (percentage >= 50) return '#3498db' // Azul
      return '#f39c12' // Laranja
    }
    
    // Calcular dias restantes para a meta
    const getRemainingDays = (targetDate) => {
      const today = new Date()
      const target = new Date(targetDate)
      const diffTime = target - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays > 0 ? diffDays : 0
    }
    
    // Formatar data para exibição
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return format(date, 'dd/MM/yyyy')
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
        <StatusBar style='light' />
        <ImageBackground
          source={require('../assets/bg.png')}
          style={{ flex: 1, paddingTop: 35 }}
        >
          {/* Header */}
          <View
            style={{
              padding: 10,
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}
          >
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Image
                source={require('../assets/logo.png')}
                style={{ height: 30, width: 30, tintColor: 'white' }}
              />
              <View>
                <Text style={{ paddingHorizontal: 5, color: 'white' }}>
                  {userName}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    paddingHorizontal: 5,
                    color: 'white',
                    marginTop: -5
                  }}
                >
                  {currentMonth}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={require('../assets/Icons/back.svg')}
                style={{ height: 24, width: 24, tintColor: 'white' }}
              />
            </TouchableOpacity>
          </View>
          
          {/* Title and Add Button */}
          <View style={{ 
            paddingHorizontal: 16, 
            marginTop: 10, 
            marginBottom: 15,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
              Metas Financeiras
            </Text>
            
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
          </View>
          
          {/* Goals List */}
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
            {goals.length === 0 ? (
              <BlurView
                intensity={60}
                tint='dark'
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  padding: 30,
                  alignItems: 'center',
                  marginBottom: 20
                }}
              >
                <Image
                  source={require('../assets/Icons/target.svg')}
                  style={{ height: 60, width: 60, tintColor: 'rgba(255,255,255,0.5)' }}
                />
                <Text style={{ 
                  color: 'white', 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  marginTop: 15,
                  marginBottom: 5
                }}>
                  Sem metas financeiras
                </Text>
                <Text style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  textAlign: 'center',
                  lineHeight: 20
                }}>
                  Defina metas financeiras para acompanhar seu progresso de economia para objetivos importantes
                </Text>
              </BlurView>
            ) : (
              goals.map(goal => (
                <BlurView
                  key={goal.id}
                  intensity={60}
                  tint='dark'
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    marginBottom: 15,
                    padding: 15
                  }}
                >
                  <View style={styles.goalHeader}>
                    <View>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      {goal.description && (
                        <Text style={styles.goalDescription}>{goal.description}</Text>
                      )}
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => handleDeleteGoal(goal.id)}
                    >
                      <Image
                        source={require('../assets/Icons/trash.svg')}
                        style={{ height: 20, width: 20, tintColor: 'white' }}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.goalAmounts}>
                    <Text style={styles.currentAmount}>
                      {formatCurrency(goal.current_amount)} 
                      <Text style={styles.targetAmount}> / {formatCurrency(goal.target_amount)}</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBar,
                          { 
                            width: `${getGoalProgressPercent(goal)}%`,
                            backgroundColor: getGoalProgressColor(goal)
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.percentageText}>
                      {getGoalProgressPercent(goal)}%
                    </Text>
                  </View>
                  
                  <View style={styles.goalDetails}>
                    <View style={styles.goalDetailItem}>
                      <Text style={styles.goalDetailLabel}>Data Alvo</Text>
                      <Text style={styles.goalDetailValue}>{formatDate(goal.target_date)}</Text>
                    </View>
                    
                    <View style={styles.goalDetailItem}>
                      <Text style={styles.goalDetailLabel}>Dias Restantes</Text>
                      <Text style={styles.goalDetailValue}>{getRemainingDays(goal.target_date)}</Text>
                    </View>
                    
                    <View style={styles.goalDetailItem}>
                      <Text style={styles.goalDetailLabel}>Restante</Text>
                      <Text style={styles.goalDetailValue}>
                        {formatCurrency(goal.target_amount - goal.current_amount)}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Formulário de contribuição */}
                  <Formik
                    initialValues={{ contribution: '' }}
                    onSubmit={(values, { resetForm }) => {
                      handleAddContribution(goal.id, values.contribution)
                      resetForm()
                    }}
                  >
                    {({ handleChange, handleSubmit, values }) => (
                      <View style={styles.contributionForm}>
                        <TextInput
                          style={styles.contributionInput}
                          placeholder="Valor da contribuição"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          keyboardType="numeric"
                          value={values.contribution}
                          onChangeText={handleChange('contribution')}
                        />
                        
                        <TouchableOpacity
                          style={styles.contributionButton}
                          onPress={handleSubmit}
                        >
                          <Text style={styles.contributionButtonText}>Adicionar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Formik>
                </BlurView>
              ))
            )}
            
            <View style={{ height: 20 }} />
          </ScrollView>
          
          {/* Add Goal Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={showAddModal}
            onRequestClose={() => setShowAddModal(false)}
          >
            <View style={styles.modalOverlay}>
              <BlurView
                intensity={100}
                tint='dark'
                style={styles.modalContainer}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Nova Meta Financeira</Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <Image
                      source={require('../assets/Icons/close.svg')}
                      style={{ height: 20, width: 20, tintColor: 'white' }}
                    />
                  </TouchableOpacity>
                </View>
                
                <Formik
                  initialValues={{ 
                    title: '', 
                    target_amount: '', 
                    initial_amount: '',
                    description: ''
                  }}
                  validationSchema={goalValidationSchema}
                  onSubmit={handleAddGoal}
                >
                  {({
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    values,
                    errors,
                    touched,
                    setFieldTouched
                  }) => (
                    <ScrollView style={styles.formContainer}>
                      <Text style={styles.inputLabel}>Título da Meta</Text>
                      <TextInput
                        style={[
                          styles.input,
                          touched.title && errors.title ? styles.inputError : {}
                        ]}
                        placeholder="Ex: Viagem de férias"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={values.title}
                        onChangeText={handleChange('title')}
                        onBlur={() => setFieldTouched('title')}
                      />
                      {touched.title && errors.title && (
                        <Text style={styles.errorText}>{errors.title}</Text>
                      )}
                      
                      <Text style={styles.inputLabel}>Valor Alvo</Text>
                      <View style={styles.currencyInputContainer}>
                        <Text style={styles.currencySymbol}>MZN</Text>
                        <TextInput
                          style={[
                            styles.currencyInput,
                            touched.target_amount && errors.target_amount ? styles.inputError : {}
                          ]}
                          placeholder="0,00"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          keyboardType="numeric"
                          value={values.target_amount}
                          onChangeText={handleChange('target_amount')}
                          onBlur={() => setFieldTouched('target_amount')}
                        />
                      </View>
                      {touched.target_amount && errors.target_amount && (
                        <Text style={styles.errorText}>{errors.target_amount}</Text>
                      )}
                      
                      <Text style={styles.inputLabel}>Valor Inicial (opcional)</Text>
                      <View style={styles.currencyInputContainer}>
                        <Text style={styles.currencySymbol}>MZN</Text>
                        <TextInput
                          style={[
                            styles.currencyInput,
                            touched.initial_amount && errors.initial_amount ? styles.inputError : {}
                          ]}
                          placeholder="0,00"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          keyboardType="numeric"
                          value={values.initial_amount}
                          onChangeText={handleChange('initial_amount')}
                          onBlur={() => setFieldTouched('initial_amount')}
                        />
                      </View>
                      {touched.initial_amount && errors.initial_amount && (
                        <Text style={styles.errorText}>{errors.initial_amount}</Text>
                      )}
                      
                      <Text style={styles.inputLabel}>Data Alvo (DD/MM/AAAA)</Text>
                      <View style={styles.dateInputContainer}>
                        <TextInput
                          style={styles.dateInput}
                          placeholder="DD"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          keyboardType="numeric"
                          maxLength={2}
                          value={dateInputs.day}
                          onChangeText={(text) => {
                            // Validar que é um número entre 1 e 31
                            if ((text === '' || (/^\d+$/.test(text) && parseInt(text) > 0 && parseInt(text) <= 31))) {
                              setDateInputs({...dateInputs, day: text});
                              
                              // Auto avançar para o próximo campo se dois dígitos foram digitados
                              if (text.length === 2 && monthInputRef.current) {
                                monthInputRef.current.focus();
                              }
                            }
                          }}
                        />
                        <Text style={styles.dateSeparator}>/</Text>
                        <TextInput
                          ref={monthInputRef}
                          style={styles.dateInput}
                          placeholder="MM"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          keyboardType="numeric"
                          maxLength={2}
                          value={dateInputs.month}
                          onChangeText={(text) => {
                            // Validar que é um número entre 1 e 12
                            if ((text === '' || (/^\d+$/.test(text) && parseInt(text) > 0 && parseInt(text) <= 12))) {
                              setDateInputs({...dateInputs, month: text});
                              
                              // Auto avançar para o próximo campo se dois dígitos foram digitados
                              if (text.length === 2 && yearInputRef.current) {
                                yearInputRef.current.focus();
                              }
                            }
                          }}
                        />
                        <Text style={styles.dateSeparator}>/</Text>
                        <TextInput
                          ref={yearInputRef}
                          style={[styles.dateInput, { flex: 1.2 }]}
                          placeholder="AAAA"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          keyboardType="numeric"
                          maxLength={4}
                          value={dateInputs.year}
                          onChangeText={(text) => {
                            // Validar que é um número e no mínimo o ano atual
                            const currentYear = new Date().getFullYear();
                            if (text === '' || (/^\d+$/.test(text) && (text.length < 4 || parseInt(text) >= currentYear))) {
                              setDateInputs({...dateInputs, year: text});
                            }
                          }}
                        />
                      </View>
                      
                      <Text style={styles.inputLabel}>Descrição (opcional)</Text>
                      <TextInput
                        style={[
                          styles.textArea,
                          touched.description && errors.description ? styles.inputError : {}
                        ]}
                        placeholder="Descreva sua meta financeira"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        multiline
                        numberOfLines={4}
                        value={values.description}
                        onChangeText={handleChange('description')}
                        onBlur={() => setFieldTouched('description')}
                      />
                      {touched.description && errors.description && (
                        <Text style={styles.errorText}>{errors.description}</Text>
                      )}
                      
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={[styles.button, styles.cancelButton]}
                          onPress={() => setShowAddModal(false)}
                        >
                          <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.button, styles.saveButton]}
                          onPress={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Text style={styles.buttonText}>Salvar</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  )}
                </Formik>
              </BlurView>
            </View>
          </Modal>
        </ImageBackground>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    // Goal item styles
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10
    },
    goalTitle: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold'
    },
    goalDescription: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 14,
      marginTop: 4
    },
    goalAmounts: {
      marginVertical: 5
    },
    currentAmount: {
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold'
    },
    targetAmount: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontWeight: 'normal'
    },
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10
    },
    progressBarBackground: {
      flex: 1,
      height: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 5,
      overflow: 'hidden',
      marginRight: 10
    },
    progressBar: {
      height: 10,
      borderRadius: 5
    },
    percentageText: {
      color: 'white',
      fontSize: 12,
      width: 40,
      textAlign: 'right'
    },
    goalDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 10,
      padding: 10
    },
    goalDetailItem: {
      alignItems: 'center',
      flex: 1
    },
    goalDetailLabel: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: 12,
      marginBottom: 2
    },
    goalDetailValue: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold'
    },
    contributionForm: {
      flexDirection: 'row',
      marginTop: 10
    },
    contributionInput: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: 'white',
      marginRight: 10
    },
    contributionButton: {
      backgroundColor: '#3498db',
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 15,
      justifyContent: 'center'
    },
    contributionButtonText: {
      color: 'white',
      fontWeight: 'bold'
    },
    
    // Modal styles
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',borderRadius: 20,
      borderRadius: 20,
    },
    modalContainer: {
      width: '100%',
      // maxHeight: '80%',
      // borderRadius: 20,
      padding: 20,
      backgroundColor: 'rgba(30, 29, 37, 0.95)',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    },
    modalTitle: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold'
    },
    formContainer: {
      width: '100%'
    },
    inputLabel: {
      color: 'white',
      marginBottom: 5
    },
    input: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
      color: 'white',
      marginBottom: 15
    },
    currencyInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 10,
      marginBottom: 15
    },
    currencySymbol: {
      color: 'white',
      paddingHorizontal: 15
    },
    currencyInput: {
      flex: 1,
      color: 'white',
      paddingVertical: 10,
      paddingHorizontal: 5
    },
    dateInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 10,
      paddingHorizontal: 15,
      marginBottom: 15
    },
    dateInput: {
        flex: 1,
        color: 'white',
        paddingVertical: 10,
        textAlign: 'center',
        fontSize: 16
      },
      dateSeparator: {
        color: 'white',
        paddingHorizontal: 5,
        fontSize: 16
      },
      textArea: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        color: 'white',
        marginBottom: 15,
        textAlignVertical: 'top',
        minHeight: 100
      },
      inputError: {
        borderColor: '#e74c3c',
        borderWidth: 1
      },
      errorText: {
        color: '#e74c3c',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 15
      },
      modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingBottom:20
      },
      button: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center'
      },
      cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        marginRight: 8
      },
      saveButton: {
        backgroundColor: '#007BFF',
        marginLeft: 8
      },
      buttonText: {
        color: 'white',
        fontWeight: 'bold'
      }
    });