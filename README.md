# carolyn_ai

This repository classifies any sms into 4 classes : **Spam**, **OTP**, **Transaction**, **Update**
The dataset is made using Indian sms dataset and contains 1138 spam, 345 update, 309 transactional and 165 otp sms. 

## Requirements

The requirements for training the model are :
- Python 3.6 or above
- Tensorflow
- Keras
- Scikit-learn
- Nlpaug (For data augmentation)

## Data Augmentation

Data is balanced using data-augmentation. We have used nlpaug to remove and add random words in update, transactional, otp.
For example
