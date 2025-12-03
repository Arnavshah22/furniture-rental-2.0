import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cart from '@/model/cart.model';
import Furniture from '@/model/furniture.model'; // Import your Furniture model

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId"); // Get userId from query params
  console.log("User ID from request:", userId); // Log the userId for debugging

  await dbConnect();

  try {
    // Find the cart for the given userId
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'furnitureItems.item',
      model: Furniture, // Specify the Furniture model here for population
      select: 'name price description image category available', // Specify fields to populate
    });

    if (!cart) {
      return NextResponse.json({ message: 'Cart not found' }, { status: 404 });
    }

    // Calculate totals
    let totalProductRent = 0;
    let totalDeposit = 0;

    // Process items to calculate totals and ensure deposit exists
    const processedItems = cart.furnitureItems.map((cartItem: any) => {
      const item = cartItem.item;
      // Default deposit to price if not present
      const deposit = item.deposit || item.price;

      totalProductRent += item.price * cartItem.quantity;
      totalDeposit += deposit * cartItem.quantity;

      return {
        _id: cartItem._id,
        quantity: cartItem.quantity,
        item: {
          ...item.toObject(),
          deposit: deposit
        }
      };
    });

    const deliveryCharges = 100;
    const gst = 20;
    const payableNow = totalDeposit + deliveryCharges;
    const totalMonthlyRent = totalProductRent + gst;

    const cartData = {
      payableNow,
      totalMonthlyRent,
      items: {
        price: totalProductRent
      },
      furnitureItems: processedItems
    };

    return NextResponse.json({ cart: cartData }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching cart:", error);
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
    return NextResponse.json({ message: 'Error fetching cart', error: errorMessage }, { status: 500 });
  }
}
