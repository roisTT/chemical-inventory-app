import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Modal, 
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChemicalInventoryApp = () => {
  const [chemicals, setChemicals] = useState([]);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedChemicals = await AsyncStorage.getItem('chemicals');
        if (storedChemicals) {
          setChemicals(JSON.parse(storedChemicals));
        }
      } catch (error) {
        console.error('Error loading chemicals:', error);
      }
    };
    fetchData();
  }, []);

  const saveToStorage = async (data) => {
    try {
      await AsyncStorage.setItem('chemicals', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving chemicals:', error);
    }
  };

  const addNewProduct = async () => {
    const { name, stock, unit, minStock } = productModal.product;
    
    if (!name.trim()) {
      Alert.alert("Error", "El nombre del producto no puede estar vacío");
      return;
    }

    if (stock < 0 || minStock < 0) {
      Alert.alert("Error", "Las cantidades no pueden ser negativas");
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: name.trim(),
      stock: parseFloat(stock),
      unit,
      minStock: parseFloat(minStock),
      lastUpdated: new Date(),
      logs: []
    };

    const updatedChemicals = [...chemicals, newProduct];
    setChemicals(updatedChemicals);
    await saveToStorage(updatedChemicals);

    setProductModal({ 
      visible: false, 
      mode: 'add', 
      product: {
        name: '',
        stock: 0,
        unit: 'kg',
        minStock: 10
      }
    });
  };

  const editProduct = async () => {
    const { name, stock, unit, minStock } = productModal.product;
    
    if (!name.trim()) {
      Alert.alert("Error", "El nombre del producto no puede estar vacío");
      return;
    }

    const updatedChemicals = chemicals.map(chemical => 
      chemical.id === productModal.product.id 
        ? {
            ...chemical,
            name: name.trim(),
            stock: parseFloat(stock),
            unit,
            minStock: parseFloat(minStock),
            lastUpdated: new Date()
          }
        : chemical
    );

    setChemicals(updatedChemicals);
    await saveToStorage(updatedChemicals);

    setProductModal({ 
      visible: false, 
      mode: 'add', 
      product: {
        name: '',
        stock: 0,
        unit: 'kg',
        minStock: 10
      }
    });
  };

  const deleteProduct = async (productId) => {
    Alert.alert(
      "Confirmar Eliminación", 
      "¿Estás seguro de eliminar este producto?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const updatedChemicals = chemicals.filter(
              chemical => chemical.id !== productId
            );
            
            setChemicals(updatedChemicals);
            await saveToStorage(updatedChemicals);
          }
        }
      ]
    );
  };

  const [productModal, setProductModal] = useState({
    visible: false,
    mode: 'add',
    product: {
      name: '',
      stock: 0,
      unit: 'kg',
      minStock: 10
    }
  });

  const ProductManagementModal = () => (
    <Modal
      visible={productModal.visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {productModal.mode === 'add' 
              ? 'Añadir Nuevo Producto' 
              : 'Editar Producto'}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nombre del Producto"
            value={productModal.product.name}
            onChangeText={(name) => setProductModal(prev => ({
              ...prev,
              product: { ...prev.product, name }
            }))}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Stock Inicial"
            keyboardType="numeric"
            value={productModal.product.stock.toString()}
            onChangeText={(stock) => setProductModal(prev => ({
              ...prev,
              product: { ...prev.product, stock: stock }
            }))}
          />
          
          <View style={styles.pickerContainer}>
            <Text>Unidad de Medida:</Text>
            {['kg', 'L', 'g', 'mL'].map((unit) => (
              <TouchableOpacity 
                key={unit}
                style={[styles.unitButton, productModal.product.unit === unit && styles.selectedUnitButton]}
                onPress={() => setProductModal(prev => ({
                  ...prev,
                  product: { ...prev.product, unit }
                }))}
              >
                <Text>{unit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Stock Mínimo"
            keyboardType="numeric"
            value={productModal.product.minStock.toString()}
            onChangeText={(minStock) => setProductModal(prev => ({
              ...prev,
              product: { ...prev.product, minStock: minStock }
            }))}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setProductModal(prev => ({ 
                ...prev, 
                visible: false 
              }))}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={productModal.mode === 'add' ? addNewProduct : editProduct}
            >
              <Text style={styles.buttonText}>
                {productModal.mode === 'add' ? 'Añadir' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderProductList = () => {
    return chemicals.map(chemical => (
      <View key={chemical.id} style={styles.chemicalItem}>
        <View style={styles.chemicalInfo}>
          <Text style={styles.chemicalName}>{chemical.name}</Text>
          <Text>Stock: {chemical.stock} {chemical.unit}</Text>
          <Text>Stock Mínimo: {chemical.minStock} {chemical.unit}</Text>
        </View>
        <View style={styles.chemicalActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setProductModal({
              visible: true,
              mode: 'edit',
              product: { ...chemical }
            })}
          >
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteProduct(chemical.id)}
          >
            <Text style={styles.buttonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  const AddProductButton = () => (
    <TouchableOpacity
      style={styles.addProductButton}
      onPress={() => setProductModal({
        visible: true,
        mode: 'add',
        product: {
          name: '',
          stock: 0,
          unit: 'kg',
          minStock: 10
        }
      })}
    >
      <Text style={styles.addProductButtonText}>+ Añadir Nuevo Producto</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AddProductButton />
      <ScrollView>
        {renderProductList()}
      </ScrollView>
      <ProductManagementModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  addProductButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    alignItems: 'center',
    margin: 10,
    borderRadius: 5
  },
  addProductButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  chemicalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  editButton: {
    backgroundColor: '#2196F3',
    padding: 5,
    borderRadius: 3,
    marginRight: 5
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 5,
    borderRadius: 3
  },
  pickerContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center',
    marginVertical: 10
  },
  unitButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5
  },
  selectedUnitButton: {
    backgroundColor: '#007bff',
    color: 'white'
  }
});

export default ChemicalInventoryApp;
