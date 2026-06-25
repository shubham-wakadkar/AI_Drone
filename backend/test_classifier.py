from classifier.classify import classify

label, confidence = classify("outputs/crop.jpg")

print(label)
print(confidence)