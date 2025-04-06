import {
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
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

// Removendo importação potencialmente problemática
// import { PieChart, LineChart } from 'react-native-chart-kit'

export default function AnalysisScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState(null)
  const [currentMonth, setCurrentMonth] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('month') // 'week', 'month', 'year'
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState({
    labels: [],
    entries: [],
    expenses: []
  })
  const [error, setError] = useState(null)
  
  const screenWidth = Dimensions.get('window').width - 40;
  
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
          fetchAnalysisData(storedUserId, selectedPeriod)
        } else {
          setError("Não foi possível obter os dados do usuário")
          setLoading(false)
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
        setError("Erro ao buscar dados do usuário")
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])
  
  useEffect(() => {
    if (userId) {
      fetchAnalysisData(userId, selectedPeriod)
    }
  }, [selectedPeriod, userId])
  
  const fetchAnalysisData = async (userId, period) => {
    setLoading(true)
    setError(null)
    
    try {
      // Buscar gastos por categoria
      const categoryResponse = await axios.get(`${API_UEL}/expenses-by-category`, {
        params: { user_id: userId, period: period }
      })
      
      if (categoryResponse.data && Array.isArray(categoryResponse.data)) {
        setCategoryData(categoryResponse.data)
      } else {
        setCategoryData([])
      }
      
      // Buscar dados mensais
      const monthlyResponse = await axios.get(`${API_UEL}/monthly-trends`, {
        params: { user_id: userId, period: period }
      })
      
      if (monthlyResponse.data && monthlyResponse.data.labels) {
        setMonthlyData({
          labels: monthlyResponse.data.labels || [],
          entries: monthlyResponse.data.entries || [],
          expenses: monthlyResponse.data.expenses || []
        })
      }
      
    } catch (error) {
      console.error('Erro ao buscar dados para análise:', error)
      setError('Erro ao carregar dados para análise')
    } finally {
      setLoading(false)
    }
  }
  
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value)
  }
  
  const totalByCategory = (categoryName) => {
    const category = categoryData.find(cat => cat.category_name === categoryName)
    return category ? category.total_amount : 0
  }
  
  const getTopCategories = () => {
    // Retornar as 3 principais categorias por valor gasto
    return [...categoryData]
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 3)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor:"white"}}>
        <Image source={require('../assets/spinner.gif')} style={{ width: 100, height: 100 }} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>{error}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: 'rgba(52, 152, 219, 0.8)',
            padding: 10,
            borderRadius: 10
          }}
        >
          <Text style={{ color: 'white' }}>Voltar</Text>
        </TouchableOpacity>
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
        
        {/* Title */}
        <View style={{ paddingHorizontal: 16, marginTop: 10, marginBottom: 15 }}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
            Análise Financeira
          </Text>
        </View>
        
        {/* Period selector */}
        <BlurView
          intensity={60}
          tint='dark'
          style={{
            marginHorizontal: 16,
            borderRadius: 16,
            overflow: 'hidden',
            padding: 10,
            marginBottom: 15
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'week' ? styles.periodButtonActive : {}
              ]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === 'week' ? styles.periodButtonTextActive : {}
              ]}>
                Semana
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'month' ? styles.periodButtonActive : {}
              ]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === 'month' ? styles.periodButtonTextActive : {}
              ]}>
                Mês
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'year' ? styles.periodButtonActive : {}
              ]}
              onPress={() => setSelectedPeriod('year')}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === 'year' ? styles.periodButtonTextActive : {}
              ]}>
                Ano
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
        
        <ScrollView style={{ flex: 1 }}>
          {/* Expenses by Category */}
          <View style={{ marginBottom: 25 }}>
            <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                Gastos por Categoria
              </Text>
            </View>
            
            <BlurView
              intensity={60}
              tint='dark'
              style={{
                marginHorizontal: 16,
                borderRadius: 16,
                overflow: 'hidden',
                padding: 20
              }}
            >
              {categoryData && categoryData.length > 0 ? (
                <View>
                  {/* Substitui o gráfico de pizza por uma lista simples */}
                  {getTopCategories().map((category, index) => (
                    <View key={index} style={styles.categoryItem}>
                      <View style={styles.categoryNameContainer}>
                        <View 
                          style={[styles.categoryDot, { 
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'][index % 3] 
                          }]} 
                        />
                        <Text style={styles.categoryName}>{category.category_name}</Text>
                      </View>
                      <Text style={styles.categoryValue}>
                        {formatCurrency(category.total_amount)}
                      </Text>
                    </View>
                  ))}
                  
                  {/* Barra de progresso para representar proporção */}
                  <View style={styles.categoryBarContainer}>
                    {getTopCategories().map((category, index) => {
                      const total = getTopCategories().reduce((sum, cat) => sum + cat.total_amount, 0);
                      const percentage = total > 0 ? (category.total_amount / total) * 100 : 0;
                      return (
                        <View 
                          key={index}
                          style={[
                            styles.categoryBarSegment,
                            { 
                              width: `${percentage}%`,
                              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'][index % 3]
                            }
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <Image
                    source={require('../assets/Icons/chart.svg')}
                    style={{ height: 60, width: 60, tintColor: 'rgba(255,255,255,0.5)' }}
                  />
                  <Text style={styles.noDataText}>
                    Sem dados de gastos por categoria
                  </Text>
                </View>
              )}
            </BlurView>
          </View>
          
          {/* Monthly Trends */}
          <View style={{ marginBottom: 25 }}>
            <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                Evolução de Receitas e Despesas
              </Text>
            </View>
            
            <BlurView
              intensity={60}
              tint='dark'
              style={{
                marginHorizontal: 16,
                borderRadius: 16,
                overflow: 'hidden',
                padding: 20
              }}
            >
              {monthlyData.labels && monthlyData.labels.length > 0 ? (
                <View>
                  {/* Substitui o gráfico de linha por uma tabela simples */}
                  <View style={styles.trendTable}>
                    <View style={styles.trendTableHeader}>
                      <Text style={styles.trendTableHeaderCell}>Período</Text>
                      <Text style={styles.trendTableHeaderCell}>Entradas</Text>
                      <Text style={styles.trendTableHeaderCell}>Despesas</Text>
                    </View>
                    
                    {monthlyData.labels.map((label, index) => (
                      <View key={index} style={styles.trendTableRow}>
                        <Text style={styles.trendTableCell}>{label}</Text>
                        <Text style={[styles.trendTableCell, { color: '#2ecc71' }]}>
                          {formatCurrency(monthlyData.entries[index] || 0)}
                        </Text>
                        <Text style={[styles.trendTableCell, { color: '#e74c3c' }]}>
                          {formatCurrency(monthlyData.expenses[index] || 0)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
                      <Text style={styles.legendText}>Entradas</Text>
                    </View>
                    
                    <View style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
                      <Text style={styles.legendText}>Despesas</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <Image
                    source={require('../assets/Icons/chart.svg')}
                    style={{ height: 60, width: 60, tintColor: 'rgba(255,255,255,0.5)' }}
                  />
                  <Text style={styles.noDataText}>
                    Sem dados suficientes para o gráfico
                  </Text>
                </View>
              )}
            </BlurView>
          </View>
          
          <View style={{ height: 30 }} />
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  // Botões de período
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5
  },
  periodButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  periodButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14
  },
  periodButtonTextActive: {
    color: 'white',
    fontWeight: 'bold'
  },
  
  // Contêiner sem dados
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    height: 200
  },
  noDataText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 15,
    textAlign: 'center'
  },
  
  // Legenda
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  legendText: {
    color: 'white',
    fontSize: 12
  },
  
  // Itens de categoria
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  categoryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  categoryName: {
    color: 'white',
    fontSize: 14
  },
  categoryValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  categoryBarContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 15
  },
  categoryBarSegment: {
    height: '100%'
  },
  
  // Tabela de tendências
  trendTable: {
    width: '100%'
  },
  trendTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8
  },
  trendTableHeaderCell: {
    flex: 1,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  trendTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  trendTableCell: {
    flex: 1,
    color: 'white',
    fontSize: 12
  }
});