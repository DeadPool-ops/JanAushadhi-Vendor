import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeContext } from '../../context/ThemeContext';
import { storeTheme } from '../../theme/storeTheme';
import { baseImageUrl, getProductList } from '../../api/otherApi';
import ProductDetailModal from '../../components/ProductDetailModal';

const windowWidth = Dimensions.get('window').width;
const PLACEHOLDER = 'https://via.placeholder.com/400x300.png?text=No+Image';

const StoreScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const colors = storeTheme[theme];
  const isDark = theme === 'dark';

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewer, setViewer] = useState({ visible: false, uri: null });
  const [error, setError] = useState(null);
  
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const buildImageUrl = filename => {
    if (!filename) return PLACEHOLDER;
    if (filename.startsWith('http')) return filename;
    return `${baseImageUrl}${filename}`;
  };

  const handleViewProduct = productId => {
    setSelectedProductId(productId);
    setDetailModalVisible(true);
  };

  const normalizeProduct = apiItem => {
    const imagesObj = apiItem.image || {};
    const images = Object.keys(imagesObj)
      .sort()
      .map(k => imagesObj[k])
      .filter(Boolean)
      .map(buildImageUrl);

    return {
      id: apiItem.product_id?.toString() ?? Math.random().toString(),
      name: apiItem.product_name ?? 'Unknown Product',
      generic: apiItem.generic_name ?? '',
      mrp: apiItem.mrp ?? '',
      price: apiItem.sale_price ?? '',
      images: images.length ? images : [PLACEHOLDER],
      raw: apiItem,
    };
  };

  const extractArray = res => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return [];
  };

  const fetchProducts = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await getProductList();
      console.log(res);
      const list = extractArray(res);
      setProducts(list.map(normalizeProduct));
    } catch {
      setError('Unable to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(false);
  };

  const filtered = products.filter(p => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) || p.generic.toLowerCase().includes(q)
    );
  });

  const renderProduct = ({ item }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardInner}>
        <HorizontalImages
          images={item.images}
          onPressImage={uri => setViewer({ visible: true, uri })}
          colors={colors}
        />

        <View style={styles.cardRight}>
          <Text style={[styles.productName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.productDesc, { color: colors.subText }]}>
            {item.generic}
          </Text>
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            ₹{item.price}{' '}
            <Text style={{ color: colors.mutedText, fontSize: 12 }}>
              (MRP ₹{item.mrp})
            </Text>
          </Text>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.actionBg,
                  borderColor: colors.actionBorder,
                },
              ]}
              onPress={() => handleViewProduct(item.id)}
            >
              <Text style={[styles.actionText, { color: colors.actionText }]}>
                View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.ghostBtn]}
              onPress={() => setViewer({ visible: true, uri: item.images[0] })}
            >
              <Text style={[styles.ghostText, { color: colors.mutedText }]}>
                Preview
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* HEADER */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[
            styles.backCircle,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backArrow, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.titleWrapper}>
          <View
            style={[
              styles.titlePill,
              {
                backgroundColor: colors.pillBg,
                borderColor: colors.pillBorder,
              },
            ]}
          >
            <Text style={[styles.titlePillText, { color: colors.text }]}>
              Products
            </Text>
          </View>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrapper}>
        <TextInput
          placeholder="Search products..."
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.searchBg,
              borderColor: colors.border,
              color: colors.searchText,
            },
          ]}
        />
      </View>

      {/* LIST */}
      {loading && !refreshing ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ color: colors.subText, marginTop: 8 }}>
            Loading products...
          </Text>
        </View>
      ) : error ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#DC2626' }}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.subText }]}>
              {products.length === 0
                ? 'No products yet'
                : `No products match “${query}”`}
            </Text>
          </View>
        }
      />

      {/* IMAGE VIEWER */}
      <Modal visible={viewer.visible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setViewer({ visible: false, uri: null })}
          />
          <View
            style={[styles.modalInner, { backgroundColor: colors.modalBg }]}
          >
            <Image
              source={{ uri: viewer.uri || PLACEHOLDER }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setViewer({ visible: false, uri: null })}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ProductDetailModal
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedProductId(null);
        }}
        productId={selectedProductId}
      />
    </SafeAreaView>
  );
};

export default StoreScreen;

/* ---------------- COMPONENTS ---------------- */

const HorizontalImages = ({ images = [], onPressImage, colors }) => (
  <View style={styles.imageCarousel}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {images.map((uri, i) => (
        <TouchableOpacity key={i} onPress={() => onPressImage(uri)}>
          <Image
            source={{ uri }}
            style={[styles.thumbnail, { borderColor: colors.border }]}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
    <View style={styles.imageCountPill}>
      <Text style={styles.imageCountText}>{images.length} photos</Text>
    </View>
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },

  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 12,
  },

  backArrow: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 6,
  },

  titleWrapper: {
    flex: 1,
    alignItems: 'center',
    marginRight: 60,
  },

  titlePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  titlePillText: {
    fontWeight: '700',
    fontSize: 18,
  },

  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  searchInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
    paddingTop: 6,
  },

  card: {
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  cardInner: {
    flexDirection: 'row',
    padding: 12,
  },

  cardRight: {
    flex: 1,
    justifyContent: 'space-between',
  },

  imageCarousel: {
    width: 120,
    marginRight: 12,
  },

  thumbnail: {
    width: 100,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#E5E7EB',
  },

  imageCountPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  imageCountText: {
    color: '#FFFFFF',
    fontSize: 11,
  },

  productName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  productDesc: {
    fontSize: 12,
    marginBottom: 8,
  },

  productPrice: {
    fontWeight: '700',
    fontSize: 14,
  },

  cardActions: {
    flexDirection: 'row',
    marginTop: 8,
  },

  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },

  actionText: {
    fontWeight: '700',
    fontSize: 13,
  },

  ghostBtn: {
    marginLeft: 8,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  ghostText: {
    fontWeight: '600',
    fontSize: 13,
  },

  empty: {
    marginTop: 36,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 14,
  },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalInner: {
    width: windowWidth - 32,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },

  modalImage: {
    width: '100%',
    height: windowWidth - 120,
    borderRadius: 8,
    marginBottom: 12,
  },

  modalCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
});
