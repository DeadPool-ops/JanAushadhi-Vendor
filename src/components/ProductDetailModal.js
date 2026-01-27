import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { storeTheme } from '../theme/storeTheme';
import { getProductById, baseImageUrl } from '../api/otherApi';

const windowWidth = Dimensions.get('window').width;
const PLACEHOLDER = 'https://via.placeholder.com/400x300.png?text=No+Image';

const ProductDetailModal = ({ visible, onClose, productId }) => {
  const { theme } = useContext(ThemeContext);
  const colors = storeTheme[theme];
  const isDark = theme === 'dark';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const buildImageUrl = filename => {
    if (!filename) return PLACEHOLDER;
    if (filename.startsWith('http')) return filename;
    return `${baseImageUrl}${filename}`;
  };

  const getImages = imageObj => {
    if (!imageObj || typeof imageObj !== 'object') return [PLACEHOLDER];
    const images = Object.keys(imageObj)
      .sort()
      .map(k => imageObj[k])
      .filter(Boolean)
      .map(buildImageUrl);
    return images.length ? images : [PLACEHOLDER];
  };

  useEffect(() => {
    if (visible && productId) {
      fetchProductDetails();
    }
  }, [visible, productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProductById(productId);
      console.log('Product Detail Response:', response);

      // Extract product data
      let productData = null;
      if (response?.data?.data?.[0]) {
        productData = response.data.data[0];
      } else if (response?.data?.[0]) {
        productData = response.data[0];
      } else if (Array.isArray(response) && response[0]) {
        productData = response[0];
      }

      if (productData) {
        setProduct(productData);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setProduct(null);
    setSelectedImage(0);
    setError(null);
    onClose();
  };

  const images = product ? getImages(product.image) : [PLACEHOLDER];

  const renderInfoRow = (label, value) => {
    if (!value || value === 'null' || value === '') return null;
    return (
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: colors.subText }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    );
  };

  const renderDescription = (label, value) => {
    if (!value || value === 'null' || value === '') return null;
    return (
      <View style={styles.descriptionBlock}>
        <Text style={[styles.descriptionLabel, { color: colors.subText }]}>
          {label}
        </Text>
        <Text style={[styles.descriptionText, { color: colors.text }]}>
          {value}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                ✕
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Product Details
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.subText }]}>
                Loading product details...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={fetchProductDetails}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : product ? (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Image Gallery */}
              <View style={styles.imageSection}>
                <Image
                  source={{ uri: images[selectedImage] }}
                  style={[styles.mainImage, { backgroundColor: colors.card }]}
                  resizeMode="contain"
                />
                {images.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.thumbnailContainer}
                  >
                    {images.map((uri, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setSelectedImage(index)}
                        style={[
                          styles.thumbnailWrapper,
                          {
                            borderColor:
                              selectedImage === index
                                ? colors.primary
                                : colors.border,
                          },
                        ]}
                      >
                        <Image
                          source={{ uri }}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Product Name & Price */}
              <View
                style={[
                  styles.mainInfoCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.productName, { color: colors.text }]}>
                  {product.product_name}
                </Text>
                {product.generic_name &&
                  product.generic_name !== product.product_name && (
                    <Text
                      style={[styles.genericName, { color: colors.subText }]}
                    >
                      {product.generic_name}
                    </Text>
                  )}

                <View style={styles.priceRow}>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.salePrice, { color: colors.primary }]}>
                      ₹{product.sale_price}
                    </Text>
                    {product.mrp !== product.sale_price && (
                      <Text
                        style={[styles.mrpPrice, { color: colors.mutedText }]}
                      >
                        MRP: ₹{product.mrp}
                      </Text>
                    )}
                  </View>
                  {product.discount_percent &&
                    product.discount_percent !== '0' && (
                      <View
                        style={[
                          styles.discountBadge,
                          { backgroundColor: '#059669' },
                        ]}
                      >
                        <Text style={styles.discountText}>
                          {product.discount_percent}% OFF
                        </Text>
                      </View>
                    )}
                </View>
              </View>

              {/* Product Info */}
              <View
                style={[
                  styles.infoCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Product Information
                </Text>
                {renderInfoRow('Product ID', product.product_id)}
                {renderInfoRow('Category', product.cat_name)}
                {renderInfoRow('Sub Category', product.subcat_name)}
                {renderInfoRow('Brand', product.brand_name)}
                {renderInfoRow('HSN Code', product.hsn_code)}
                {renderInfoRow('Volume/Pack', product.volume)}
                {renderInfoRow('Unit', product.unit_name)}
                {renderInfoRow('Mfg Date', product.mfg_date)}
                {renderInfoRow('Expiry Date', product.expiry_date)}
              </View>

              {/* Composition */}
              {product.composition && (
                <View
                  style={[
                    styles.infoCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Composition
                  </Text>
                  <Text
                    style={[styles.compositionText, { color: colors.text }]}
                  >
                    {product.composition}
                  </Text>
                </View>
              )}

              {/* Descriptions */}
              {(product.description1 ||
                product.description2 ||
                product.description3 ||
                product.description4 ||
                product.description5 ||
                product.description6 ||
                product.description7) && (
                <View
                  style={[
                    styles.infoCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Description
                  </Text>
                  {renderDescription('', product.description1)}
                  {renderDescription('', product.description2)}
                  {renderDescription('', product.description3)}
                  {renderDescription('', product.description4)}
                  {renderDescription('', product.description5)}
                  {renderDescription('', product.description6)}
                  {renderDescription('', product.description7)}
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '95%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  imageSection: {
    marginBottom: 16,
  },
  mainImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 12,
  },
  thumbnailContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  thumbnailWrapper: {
    borderWidth: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
  },
  mainInfoCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  genericName: {
    fontSize: 14,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  salePrice: {
    fontSize: 24,
    fontWeight: '800',
  },
  mrpPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  compositionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  descriptionBlock: {
    marginBottom: 8,
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default ProductDetailModal;
