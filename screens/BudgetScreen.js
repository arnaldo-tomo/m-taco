import {
    Text,
    View,
    ImageBackground,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    TextInput,
    Modal,
    StyleSheet
  } from 'react-native'
  import { BlurView } from 'expo-blur'
  import { Image } from 'expo-image'
  import { StatusBar } from 'expo-status-bar'
  import React, { useState, useEffect } from 'react'
  import AsyncStorage from '@react-native-async-storage/async-storage'
  import { showMessage } from 'react-native-flash-message'
  import { API_UEL } from '../config/app'
  import axios from 'axios'
  import { format } from 'date-fns'
  import { ptBR } from 'date-fns/locale'
  import { Dropdown } from 'react-native-element-dropdown'
  import AntDesign from '@expo/vector-icons/AntDesign'
  import { Formik } from 'formik'
  import * as Yup from 'yup'
  
  export default function BudgetScreen({ navigation }) {
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState(null)
    const [userName, setUserName] = useState(null)
    const [currentMonth, setCurrentMonth] = useState('')
    const [budgets, setBudgets] = useState([])
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    
    const budgetValidationSchema = Yup.object().shape({
      amount: Yup.number()
        .required('O valor do orçamento é obrigatório')
        .positive('O valor deve ser positivo')
        .typeError('Digite um valor válido')
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
            
            fetchBudgets(storedUserId)
            fetchCategories()
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error)
        }
      }
  
      fetchUserData()
    }, [])
    
    const fetchBudgets = async (userId) => {
      try {
        const response = await axios.get(`${API_UEL}/budgets`, {
          params: { user_id: userId }
        })
        
        setBudgets(response.data)
        setLoading(false)
      } catch (error) {
        console.error('Erro ao buscar orçamentos:', error)
        setLoading(false)
      }
    }
    
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_UEL}/categories`)
        
        const categoriesFormatted = response.data.map(category => ({
          label: category.name,
          value: category.id
        }))
        
        setCategories(categoriesFormatted)
      } catch (error) {
        console.error('Erro ao buscar categorias:', error)
      }
    }
    
    const handleAddBudget = async (values, { resetForm }) => {
      if (!selectedCategory) {
        showMessage({
          message: 'Por favor, selecione uma categoria',
          type: 'warning',
          duration: 3000,
          floating: true
        })
        return
      }
      
      setSubmitting(true)
      
      try {
        const response = await axios.post(`${API_UEL}/budgets`, {
          user_id: userId,
          category_id: selectedCategory,
          amount: values.amount
        })
        
        console.log('Orçamento adicionado:', response.data)
        // Atualizar lista de orçamentos
        await fetchBudgets(userId)
        
        showMessage({
          message: 'Orçamento adicionado com sucesso!',
          type: 'success',
          duration: 3000,
          floating: true
        })
        
        // Fechar modal e resetar form
        setShowAddModal(false)
        resetForm()
        setSelectedCategory(null)
      } catch (error) {
        console.error('Erro ao adicionar orçamento:', error)
        
        showMessage({
          message: 'Erro ao adicionar orçamento',
          type: 'danger',
          duration: 3000,
          floating: true
        })
      } finally {
        setSubmitting(false)
      }
    }
    
    const handleDeleteBudget = async (budgetId) => {
      try {
        await axios.delete(`${API_UEL}/budgets/${budgetId}`)
        
        // Atualizar lista de orçamentos
        await fetchBudgets(userId)
        
        showMessage({
          message: 'Orçamento removido com sucesso!',
          type: 'success',
          duration: 3000,
          floating: true
        })
      } catch (error) {
        console.error('Erro ao remover orçamento:', error)
        
        showMessage({
          message: 'Erro ao remover orçamento',
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
    
    // Calcular porcentagem de uso do orçamento
    const getBudgetUsagePercent = (budget) => {
      if (!budget.amount) return 0
      return Math.min(100, Math.round((budget.spent / budget.amount) * 100))
    }
    
    // Determinar cor baseada no uso do orçamento
    const getBudgetStatusColor = (budget) => {
      const percentage = getBudgetUsagePercent(budget)
      
      if (percentage >= 90) return '#e74c3c' // Vermelho
      if (percentage >= 70) return '#f39c12' // Laranja
      return '#2ecc71' // Verde
    }
  
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
              Orçamentos
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
          
          {/* Budget List */}
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
            {budgets.length === 0 ? (
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
                  source={require('../assets/Icons/wallet.png')}
                  style={{ height: 60, width: 60, tintColor: 'rgba(255,255,255,0.5)' }}
                />
                <Text style={{ 
                  color: 'white', 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  marginTop: 15,
                  marginBottom: 5
                }}>
                  Sem orçamentos definidos
                </Text>
                <Text style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  textAlign: 'center',
                  lineHeight: 20
                }}>
                  Toque no botão + para adicionar um novo orçamento para suas categorias de gastos
                </Text>
              </BlurView>
            ) : (
              budgets.map(budget => (
                <BlurView
                  key={budget.id}
                  intensity={60}
                  tint='dark'
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    marginBottom: 15,
                    padding: 15
                  }}
                >
                  <View style={styles.budgetHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[
                        styles.categoryIcon,
                        { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                      ]}>
                        <Image
                          source={require('../assets/Icons/category.svg')}
                          style={{ height: 20, width: 20, tintColor: 'white' }}
                        />
                      </View>
                      <Text style={styles.categoryName}>{budget.category_name}</Text>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => handleDeleteBudget(budget.id)}
                    >
                      <Image
                        source={require('../assets/Icons/trash.svg')}
                        style={{ height: 20, width: 20, tintColor: 'white' }}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.budgetAmounts}>
                    <Text style={styles.spentAmount}>
                      {formatCurrency(budget.spent)} 
                      <Text style={styles.totalBudget}> / {formatCurrency(budget.amount)}</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBar,
                          { 
                            width: `${getBudgetUsagePercent(budget)}%`,
                            backgroundColor: getBudgetStatusColor(budget)
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.percentageText}>
                      {getBudgetUsagePercent(budget)}%
                    </Text>
                  </View>
                  
                  <Text style={styles.remainingText}>
                    {budget.amount > budget.spent 
                      ? `Restante: ${formatCurrency(budget.amount - budget.spent)}`
                      : `Excedido: ${formatCurrency(budget.spent - budget.amount)}`
                    }
                  </Text>
                </BlurView>
              ))
            )}
            
            <View style={{ height: 20 }} />
          </ScrollView>
          
          {/* Add Budget Modal */}
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
                  <Text style={styles.modalTitle}>Adicionar Orçamento</Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <AntDesign name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
                
                <Formik
                  initialValues={{ amount: '' }}
                  validationSchema={budgetValidationSchema}
                  onSubmit={handleAddBudget}
                >
                  {({
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    values,
                    errors,
                    touched
                  }) => (
                    <View style={styles.formContainer}>
                      <Text style={styles.inputLabel}>Categoria</Text>
                      <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.inputSearchStyle}
                        iconStyle={styles.iconStyle}
                        data={categories}
                        search
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder="Selecione uma categoria"
                        searchPlaceholder="Pesquisar categoria"
                        value={selectedCategory}
                        onChange={item => {
                          setSelectedCategory(item.value)
                        }}
                      />
                      
                      <Text style={styles.inputLabel}>Valor do Orçamento</Text>
                      <View style={styles.currencyInputContainer}>
                        <Text style={styles.currencySymbol}>MZN</Text>
                        <TextInput
                          style={[
                            styles.input,
                            touched.amount && errors.amount ? styles.inputError : {}
                          ]}
                          placeholder="0,00"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          keyboardType="numeric"
                          value={values.amount}
                          onChangeText={handleChange('amount')}
                          onBlur={handleBlur('amount')}
                        />
                      </View>
                      
                      {touched.amount && errors.amount && (
                        <Text style={styles.errorText}>{errors.amount}</Text>
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
                    </View>
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
    // Budget item styles
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    },
    categoryIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10
    },
    categoryName: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold'
    },
    budgetAmounts: {
      marginVertical: 5
    },
    spentAmount: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold'
    },
    totalBudget: {
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
    remainingText: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 14,
      marginTop: 5
    },
    
    // Modal styles
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',borderRadius: 20,
    },
    modalContainer: {
      width: '100%',
      borderRadius: 20,
      padding: 20,
      // backgroundColor: 'rgba(30, 29, 37, 0.85)',
   
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
    dropdown: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginBottom: 15
    },
    placeholderStyle: {
      color: 'rgba(255, 255, 255, 0.5)'
    },
    selectedTextStyle: {
      color: 'white'
    },
    inputSearchStyle: {
      color: 'black',
      borderRadius: 8
    },
    iconStyle: {
      width: 20,
      height: 20
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
    input: {
      flex: 1,
      color: 'white',
      paddingVertical: 10,
      paddingHorizontal: 5
    },
    inputError: {
      borderColor: '#e74c3c'
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
      marginTop: 10
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