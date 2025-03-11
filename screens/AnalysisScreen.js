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
  import { PieChart, LineChart } from 'react-native-chart-kit'
  
  export default function AnalysisScreen({ navigation }) {
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState(null)
    const [userName, setUserName] = useState(null)
    const [currentMonth, setCurrentMonth] = useState('')
    const [selectedPeriod, setSelectedPeriod] = useState('month') // 'week', 'month', 'year'
    const [categoryData, setCategoryData] = useState([])
    const [monthlyData, setMonthlyData] = useState({
      labels: [],
      datasets: [
        {
          data: [],
          color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`, // Entradas
          strokeWidth: 2
        },
        {
          data: [],
          color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`, // Despesas
          strokeWidth: 2
        }
      ]
    })
    
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
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error)
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
      
      try {
        // Buscar gastos por categoria
        const categoryResponse = await axios.get(`${API_UEL}/expenses-by-category`, {
          params: { user_id: userId, period: period }
        })
        
        if (categoryResponse.data && categoryResponse.data.length > 0) {
          // Transformar dados para o formato do PieChart
          const pieData = categoryResponse.data.map((item, index) => {
            const colors = [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
              '#FF9F40', '#8AC54B', '#F37FB8', '#6C8893', '#FFC154'
            ]
            
            return {
              name: item.category_name,
              amount: item.total_amount,
              color: colors[index % colors.length],
              legendFontColor: '#FFF',
              legendFontSize: 12,
            }
          })
          
          setCategoryData(pieData)
        } else {
          setCategoryData([])
        }
        
        // Buscar dados mensais
        const monthlyResponse = await axios.get(`${API_UEL}/monthly-trends`, {
          params: { user_id: userId, period: period }
        })
        
        if (monthlyResponse.data && monthlyResponse.data.labels) {
          setMonthlyData({
            labels: monthlyResponse.data.labels,
            datasets: [
              {
                data: monthlyResponse.data.entries,
                color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
                strokeWidth: 2
              },
              {
                data: monthlyResponse.data.expenses,
                color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
                strokeWidth: 2
              }
            ]
          })
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Erro ao buscar dados para análise:', error)
        showMessage({
          message: 'Erro ao carregar dados para análise',
          type: 'danger',
          duration: 3000,
          floating: true
        })
        setLoading(false)
      }
    }
    
    const formatCurrency = value => {
      return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN'
      }).format(value)
    }
    
    const chartConfig = {
      backgroundGradientFrom: 'rgba(0, 0, 0, 0)',
      backgroundGradientTo: 'rgba(0, 0, 0, 0)',
      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      strokeWidth: 2,
      barPercentage: 0.5,
      useShadowColorFromDataset: false,
      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      propsForLabels: {
        fontSize: 10
      },
      propsForDots: {
        r: '4',
        strokeWidth: '2',
      }
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
                  padding: 20,
                  alignItems: 'center'
                }}
              >
                {categoryData.length > 0 ? (
                  <View>
                    <PieChart
                      data={categoryData}
                      width={screenWidth - 40}
                      height={220}
                      chartConfig={chartConfig}
                      accessor="amount"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      center={[0, 0]}
                      absolute
                    />
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
                {monthlyData.labels.length > 0 ? (
                  <View>
                    <LineChart
                      data={monthlyData}
                      width={screenWidth - 40}
                      height={220}
                      chartConfig={chartConfig}
                      bezier
                      style={{
                        borderRadius: 16
                      }}
                    />
                    
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
            
            {/* Summary Stats */}
            <View style={{ marginBottom: 25 }}>
              <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                  Resumo Financeiro
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
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Maior Gasto</Text>
                    <Text style={styles.statValue}>{formatCurrency(1250)}</Text>
                    <Text style={styles.statCategory}>Aluguel</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Maior Categoria</Text>
                    <Text style={styles.statValue}>{formatCurrency(2800)}</Text>
                    <Text style={styles.statCategory}>Alimentação</Text>
                  </View>
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Economizado</Text>
                    <Text style={[styles.statValue, {color: '#2ecc71'}]}>
                      {formatCurrency(3500)}
                    </Text>
                    <Text style={styles.statCategory}>+15% este mês</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Saldo Projetado</Text>
                    <Text style={styles.statValue}>
                      {formatCurrency(5200)}
                    </Text>
                    <Text style={styles.statCategory}>Final do mês</Text>
                  </View>
                </View>
              </BlurView>
            </View>
            
            <View style={{ height: 30 }} />
          </ScrollView>
        </ImageBackground>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
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
    statsRow: {
      flexDirection: 'row',
      marginBottom: 20
    },
    statItem: {
      flex: 1
    },
    statLabel: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 12,
      marginBottom: 5
    },
    statValue: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold'
    },
    statCategory: {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: 12,
      marginTop: 3
    },
    statDivider: {
      width: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      marginHorizontal: 15
    }
  });