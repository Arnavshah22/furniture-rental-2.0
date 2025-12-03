import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Cart from '@/model/cart.model';

export async function PUT(req: NextRequest) {
    try {
        const { userId, furnitureId, quantity } = await req.json();

        if (!userId || !furnitureId || quantity === undefined) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return NextResponse.json(
                { message: 'Cart not found' },
                { status: 404 }
            );
        }

        // Find the item in the cart
        const itemIndex = cart.furnitureItems.findIndex(
            (item: any) => item.item.toString() === furnitureId
        );

        if (itemIndex === -1) {
            return NextResponse.json(
                { message: 'Item not found in cart' },
                { status: 404 }
            );
        }

        // Update quantity
        if (quantity > 0) {
            cart.furnitureItems[itemIndex].quantity = quantity;
        } else {
            // Remove item if quantity is 0 or less (though frontend restricts to 1)
            cart.furnitureItems.splice(itemIndex, 1);
        }

        await cart.save();

        return NextResponse.json(
            { message: 'Cart updated successfully', cart },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating cart:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
