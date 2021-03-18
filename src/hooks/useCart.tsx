import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const findProduct = cart.find(product => product.id === productId);

      let newCart;

      if (findProduct) {
        updateProductAmount({ productId, amount: findProduct.amount + 1 });
      } else {
        const response = await api.get(`/products/${productId}`)

        if (!response.data) throw new Error();
        newCart = [...cart, { ...response.data, amount: 1 }]
        setCart(newCart)
        toast.success('Produto adicionado com sucesso!');
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const findProduct = cart.some(product => product.id === productId);

      if (!findProduct) throw new Error();

      const newCart = cart.filter(product => {
        return product.id !== productId;
      })
      setCart(newCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      toast.success('Produto removido com sucesso!');

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);
      const findProduct = cart.some(product => product.id === productId);

      if (!findProduct || amount < 1) throw new Error();

      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque')
      } else {
        const newCart = cart.map(product => {
          return product.id === productId
            ? { ...product, amount }
            : product
        })
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addProduct,
        removeProduct,
        updateProductAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
