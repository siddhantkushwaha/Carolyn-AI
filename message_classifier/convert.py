import tensorflow as tf
from tensorflow.python.keras.saving.save import load_model


def convert(model_path):
    model = load_model(model_path)
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()

    with open('models/model.tflite', 'wb') as f:
        f.write(tflite_model)


if __name__ == '__main__':
    convert('models/model.h5')
