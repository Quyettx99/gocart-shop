import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import imagekit from "@/configs/imageKit";

//Create the store
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    //get the data from the request
    const formData = await request.formData();
    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const address = formData.get("address");
    const image = formData.get("image");

    if (
      !name ||
      !username ||
      !description ||
      !email ||
      !contact ||
      !address ||
      !image
    ) {
      return NextResponse.json(
        { error: "missing store info" },
        { status: 400 }
      );
    }
    //check is user have already registered a store
    const store = await prisma.store.findFirst({
      where: {
        userId: userId,
      },
    });

    //if store is already registered then send status of store exists
    if (store) {
      return NextResponse.json({ status: store.status });
    }
    //check is username is already taken
    const isUsernameTaken = await prisma.store.findFirst({
      where: {
        username: username.toLowerCase(),
      },
    });
    if (isUsernameTaken) {
      return NextResponse.json(
        { error: "username is already taken" },
        { status: 400 }
      );
    }
    //image upload to imagekit
    const buffer = Buffer.from(await image.arrayBuffer());
    const response = await imagekit.upload({
      file: buffer, //required
      fileName: image.name, //required
      folder: "logos",
    });

    const optimizedImageUrl = imagekit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" },
      ],
    });

    // Create store - relation to user is automatically established via userId foreign key
    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username: username.toLowerCase(),
        email,
        contact,
        address,
        logo: optimizedImageUrl,
      },
    });

    // Note: The relation between User and Store is automatically established
    // via the userId foreign key. No need to manually connect.
    return NextResponse.json(
      { message: "applied, waiting for approval", storeId: newStore.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

//check is user have already registered a store if yes then return the store status
export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    //check is user have already registered a store
    const store = await prisma.store.findFirst({
      where: {
        userId: userId,
      },
    });

    //if store is already registered then send status of store exists
    if (store) {
      return NextResponse.json({ status: store.status });
    }
    return NextResponse.json({ status: "no-registered" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
